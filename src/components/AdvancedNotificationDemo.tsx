import React, { useState, useEffect } from 'react';
import { advancedNotificationService, Notification, NotificationTemplate, NotificationPreferences, NotificationSchedule } from '../services/advancedNotificationService';

const AdvancedNotificationDemo: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(advancedNotificationService.getPreferences());
  const [activeTab, setActiveTab] = useState<'notifications' | 'templates' | 'scheduling' | 'preferences'>('notifications');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, any>>({});
  const [scheduleForm, setScheduleForm] = useState({
    type: 'once' as 'once' | 'recurring' | 'interval',
    datetime: '',
    interval: 60,
    daysOfWeek: [] as number[],
    timeOfDay: '09:00'
  });

  useEffect(() => {
    // Set up notification listener
    const listenerId = advancedNotificationService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    // Load initial data
    loadData();

    return () => {
      advancedNotificationService.removeListener(listenerId);
    };
  }, []);

  const loadData = () => {
    setNotifications(advancedNotificationService.getNotifications());
    setTemplates(advancedNotificationService.getTemplates());
    setSchedules(advancedNotificationService.getSchedules());
    setPreferences(advancedNotificationService.getPreferences());
  };

  const createTestNotification = (type: Notification['type']) => {
    const testData = {
      info: { title: 'Information', message: 'This is an informational message' },
      success: { title: 'Success!', message: 'Operation completed successfully' },
      warning: { title: 'Warning', message: 'Please review your settings' },
      error: { title: 'Error', message: 'Something went wrong' },
      reminder: { title: 'Reminder', message: 'Don\'t forget to check your notes' },
      collaboration: { title: 'Collaboration', message: 'Someone shared a note with you' },
      system: { title: 'System Update', message: 'System maintenance scheduled' }
    };

    const data = testData[type];
    advancedNotificationService.createNotification({
      type,
      title: data.title,
      message: data.message,
      priority: type === 'error' ? 'urgent' : type === 'warning' ? 'high' : 'medium',
      category: type === 'collaboration' ? 'collaboration' : 'general'
    });
  };

  const createNotificationFromTemplate = () => {
    if (!selectedTemplate) return;

    try {
      advancedNotificationService.createNotificationFromTemplate(selectedTemplate, templateVariables);
      setTemplateVariables({});
      setSelectedTemplate('');
    } catch (error) {
      console.error('Failed to create notification from template:', error);
    }
  };

  const scheduleNotification = () => {
    const notification = {
      type: 'reminder' as Notification['type'],
      title: 'Scheduled Reminder',
      message: 'This is a scheduled notification',
      priority: 'medium' as Notification['priority'],
      category: 'reminder'
    };

    const schedule = {
      type: scheduleForm.type,
      datetime: scheduleForm.datetime ? new Date(scheduleForm.datetime) : undefined,
      interval: scheduleForm.interval,
      daysOfWeek: scheduleForm.daysOfWeek,
      timeOfDay: scheduleForm.timeOfDay
    };

    advancedNotificationService.scheduleNotification(notification, schedule);
    setScheduleForm({
      type: 'once',
      datetime: '',
      interval: 60,
      daysOfWeek: [],
      timeOfDay: '09:00'
    });
    loadData();
  };

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    advancedNotificationService.updatePreferences(updates);
    setPreferences(advancedNotificationService.getPreferences());
  };

  const markAsRead = (notificationId: string) => {
    advancedNotificationService.markAsRead(notificationId);
    setNotifications(advancedNotificationService.getNotifications());
  };

  const deleteNotification = (notificationId: string) => {
    advancedNotificationService.deleteNotification(notificationId);
    setNotifications(advancedNotificationService.getNotifications());
  };

  const cancelSchedule = (scheduleId: string) => {
    advancedNotificationService.cancelScheduledNotification(scheduleId);
    setSchedules(advancedNotificationService.getSchedules());
  };

  const getNotificationIcon = (type: Notification['type']): string => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'reminder': return '⏰';
      case 'collaboration': return '👥';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: Notification['priority']): string => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDayName = (day: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day];
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Advanced Notification Demo
        </h1>
        <p className="text-gray-600">
          Interactive notification system with templates, scheduling, and preferences
        </p>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Notifications</p>
              <p className="text-2xl font-bold text-blue-900">{notifications.length}</p>
            </div>
            <div className="text-2xl">📢</div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Unread</p>
              <p className="text-2xl font-bold text-green-900">{advancedNotificationService.getUnreadCount()}</p>
            </div>
            <div className="text-2xl">📬</div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Templates</p>
              <p className="text-2xl font-bold text-purple-900">{templates.length}</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Scheduled</p>
              <p className="text-2xl font-bold text-orange-900">{schedules.filter(s => s.active).length}</p>
            </div>
            <div className="text-2xl">⏰</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'notifications', label: 'Notifications', icon: '📢' },
              { id: 'templates', label: 'Templates', icon: '📋' },
              { id: 'scheduling', label: 'Scheduling', icon: '⏰' },
              { id: 'preferences', label: 'Preferences', icon: '⚙️' }
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
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => advancedNotificationService.markAllAsRead()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={() => {
                      advancedNotificationService.clearAllNotifications();
                      setNotifications([]);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Quick Test Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                {(['info', 'success', 'warning', 'error', 'reminder', 'collaboration', 'system'] as Notification['type'][]).map(type => (
                  <button
                    key={type}
                    onClick={() => createTestNotification(type)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      type === 'error' ? 'border-red-300 hover:bg-red-50' :
                      type === 'warning' ? 'border-yellow-300 hover:bg-yellow-50' :
                      type === 'success' ? 'border-green-300 hover:bg-green-50' :
                      type === 'info' ? 'border-blue-300 hover:bg-blue-50' :
                      type === 'reminder' ? 'border-purple-300 hover:bg-purple-50' :
                      type === 'collaboration' ? 'border-indigo-300 hover:bg-indigo-50' :
                      'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {getNotificationIcon(type)} {type}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No notifications yet. Create some test notifications above.
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        notification.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">{notification.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </span>
                              <span className="text-xs text-gray-500">{notification.category}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {notification.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Notification Templates</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Available Templates</h3>
                  <div className="space-y-3">
                    {templates.map(template => (
                      <div key={template.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            template.type === 'error' ? 'bg-red-100 text-red-800' :
                            template.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            template.type === 'success' ? 'bg-green-100 text-green-800' :
                            template.type === 'info' ? 'bg-blue-100 text-blue-800' :
                            template.type === 'reminder' ? 'bg-purple-100 text-purple-800' :
                            template.type === 'collaboration' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {template.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.message}</p>
                        <div className="text-xs text-gray-500">
                          Variables: {template.variables.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Template Usage */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Use Template</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Template
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Choose a template...</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedTemplate && (() => {
                      const template = templates.find(t => t.id === selectedTemplate);
                      if (!template) return null;

                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Template Variables
                            </label>
                            <div className="space-y-2">
                              {template.variables.map(variable => (
                                <input
                                  key={variable}
                                  type="text"
                                  placeholder={variable}
                                  value={templateVariables[variable] || ''}
                                  onChange={(e) => setTemplateVariables({
                                    ...templateVariables,
                                    [variable]: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={createNotificationFromTemplate}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Create Notification
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scheduling Tab */}
          {activeTab === 'scheduling' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Schedule Notifications</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Schedule Form */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create Schedule</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Type
                      </label>
                      <select
                        value={scheduleForm.type}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm,
                          type: e.target.value as any
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="once">Once</option>
                        <option value="recurring">Recurring</option>
                        <option value="interval">Interval</option>
                      </select>
                    </div>

                    {scheduleForm.type === 'once' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduleForm.datetime}
                          onChange={(e) => setScheduleForm({
                            ...scheduleForm,
                            datetime: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}

                    {scheduleForm.type === 'interval' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interval (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={scheduleForm.interval}
                          onChange={(e) => setScheduleForm({
                            ...scheduleForm,
                            interval: parseInt(e.target.value)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}

                    {scheduleForm.type === 'recurring' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Days of Week
                          </label>
                          <div className="grid grid-cols-7 gap-1">
                            {[0, 1, 2, 3, 4, 5, 6].map(day => (
                              <button
                                key={day}
                                onClick={() => {
                                  const days = scheduleForm.daysOfWeek.includes(day)
                                    ? scheduleForm.daysOfWeek.filter(d => d !== day)
                                    : [...scheduleForm.daysOfWeek, day];
                                  setScheduleForm({ ...scheduleForm, daysOfWeek: days });
                                }}
                                className={`p-2 text-xs rounded ${
                                  scheduleForm.daysOfWeek.includes(day)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {getDayName(day)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time of Day
                          </label>
                          <input
                            type="time"
                            value={scheduleForm.timeOfDay}
                            onChange={(e) => setScheduleForm({
                              ...scheduleForm,
                              timeOfDay: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={scheduleNotification}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Schedule Notification
                    </button>
                  </div>
                </div>

                {/* Scheduled Notifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Scheduled Notifications</h3>
                  <div className="space-y-3">
                    {schedules.filter(s => s.active).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No scheduled notifications
                      </div>
                    ) : (
                      schedules.filter(s => s.active).map(schedule => (
                        <div key={schedule.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{schedule.notification.title}</h4>
                            <button
                              onClick={() => cancelSchedule(schedule.id)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{schedule.notification.message}</p>
                          <div className="text-xs text-gray-500">
                            Type: {schedule.schedule.type} | 
                            {schedule.schedule.type === 'once' && schedule.schedule.datetime && 
                              ` Date: ${new Date(schedule.schedule.datetime).toLocaleString()}`
                            }
                            {schedule.schedule.type === 'interval' && 
                              ` Every ${schedule.schedule.interval} minutes`
                            }
                            {schedule.schedule.type === 'recurring' && 
                              ` ${schedule.schedule.daysOfWeek?.map(getDayName).join(', ')} at ${schedule.schedule.timeOfDay}`
                            }
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">In-App Notifications</label>
                      <button
                        onClick={() => updatePreferences({ inApp: !preferences.inApp })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.inApp ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.inApp ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                      <button
                        onClick={() => updatePreferences({ push: !preferences.push })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.push ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.push ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Sound</label>
                      <button
                        onClick={() => updatePreferences({ sound: !preferences.sound })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.sound ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.sound ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Vibration</label>
                      <button
                        onClick={() => updatePreferences({ vibration: !preferences.vibration })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.vibration ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.vibration ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quiet Hours */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quiet Hours</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Enable Quiet Hours</label>
                      <button
                        onClick={() => updatePreferences({
                          quietHours: { ...preferences.quietHours, enabled: !preferences.quietHours.enabled }
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {preferences.quietHours.enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={preferences.quietHours.start}
                            onChange={(e) => updatePreferences({
                              quietHours: { ...preferences.quietHours, start: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={preferences.quietHours.end}
                            onChange={(e) => updatePreferences({
                              quietHours: { ...preferences.quietHours, end: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedNotificationDemo; 