import { useMemo } from 'react';
import { Note } from '../types/domain';

export type DateMode = 'created' | 'modified';

export interface CalendarDay {
  date: Date;
  notes: Note[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  dayOfWeek: number;
}

export interface CalendarData {
  days: CalendarDay[];
  monthName: string;
  year: number;
  month: number;
  totalDays: number;
  daysWithNotes: number;
  totalNotes: number;
}

export interface CalendarDataHandlers {
  getCalendarData: (currentDate: Date, notes: Note[], dateMode: DateMode) => CalendarData;
  getMonthName: (date: Date) => string;
  getDayNames: () => string[];
  isToday: (date: Date) => boolean;
  getNotesForDate: (date: Date, notes: Note[], dateMode: DateMode) => Note[];
  getDateKey: (date: Date) => string;
  getWeekNumber: (date: Date) => number;
}

/**
 * Custom hook for managing calendar data and calculations
 * 
 * Provides:
 * - Calendar grid generation
 * - Date-based note filtering
 * - Calendar metadata and statistics
 * - Date utility functions
 */
export const useCalendarData = (): CalendarDataHandlers => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /**
   * Get calendar data for a specific month
   */
  const getCalendarData = useMemo(() => (
    currentDate: Date, 
    notes: Note[], 
    dateMode: DateMode
  ): CalendarData => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first day of calendar (including previous month's days)
    const firstCalendarDay = new Date(firstDay);
    firstCalendarDay.setDate(firstDay.getDate() - firstDay.getDay());
    
    // Get last day of calendar (including next month's days)
    const lastCalendarDay = new Date(lastDay);
    lastCalendarDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let totalNotes = 0;
    let daysWithNotes = 0;
    
    for (let d = new Date(firstCalendarDay); d <= lastCalendarDay; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const dayNotes = getNotesForDate(date, notes, dateMode);
      
      if (dayNotes.length > 0) {
        daysWithNotes++;
        totalNotes += dayNotes.length;
      }
      
      days.push({
        date: new Date(date),
        notes: dayNotes,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        dayOfWeek: date.getDay()
      });
    }
    
    return {
      days,
      monthName: getMonthName(currentDate),
      year,
      month,
      totalDays: days.length,
      daysWithNotes,
      totalNotes
    };
  }, []);

  /**
   * Get month name for a date
   */
  const getMonthName = useMemo(() => (date: Date): string => {
    return monthNames[date.getMonth()];
  }, []);

  /**
   * Get day names array
   */
  const getDayNames = useMemo(() => (): string[] => {
    return [...dayNames];
  }, []);

  /**
   * Check if a date is today
   */
  const isToday = useMemo(() => (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  }, []);

  /**
   * Get notes for a specific date based on date mode
   */
  const getNotesForDate = useMemo(() => (
    date: Date, 
    notes: Note[], 
    dateMode: DateMode
  ): Note[] => {
    const dateKey = getDateKey(date);
    if (!dateKey) return [];
    
    return notes.filter(note => {
      try {
        const noteDate = dateMode === 'created' ? note.createdAt : note.updatedAt;
        const noteDateKey = getDateKey(new Date(noteDate));
        return noteDateKey === dateKey && noteDateKey !== '';
      } catch (error) {
        // Handle invalid dates gracefully
        console.warn('Invalid date for note:', note.id, error);
        return false;
      }
    });
  }, []);

  /**
   * Get date key in YYYY-MM-DD format
   */
  const getDateKey = useMemo(() => (date: Date): string => {
    try {
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      // Use local date to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('Invalid date in getDateKey:', date, error);
      return '';
    }
  }, []);

  /**
   * Get week number for a date
   */
  const getWeekNumber = useMemo(() => (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }, []);

  return {
    getCalendarData,
    getMonthName,
    getDayNames,
    isToday,
    getNotesForDate,
    getDateKey,
    getWeekNumber
  };
}; 