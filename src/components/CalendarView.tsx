import React, { useState, useMemo, useCallback } from 'react';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { Note } from '../types/domain';

type DateMode = 'created' | 'modified';

interface CalendarViewProps {
  onNoteClick: (noteId: string) => void;
  selectedNoteId?: string;
}

interface CalendarDay {
  date: Date;
  notes: Note[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onNoteClick, selectedNoteId }) => {
  const { notes, selectNote } = useNoteStore();
  const { colors } = useThemeStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateMode, setDateMode] = useState<DateMode>(() => {
    const saved = localStorage.getItem('zettelview_calendar_date_mode');
    return (saved as DateMode) || 'created';
  });

  // Handle date mode change with persistence
  const handleDateModeChange = useCallback((mode: DateMode) => {
    setDateMode(mode);
    localStorage.setItem('zettelview_calendar_date_mode', mode);
  }, []);

  // Get calendar data for the current month
  const calendarData = useMemo(() => {
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
    
    for (let d = new Date(firstCalendarDay); d <= lastCalendarDay; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const dateKey = date.toISOString().split('T')[0];
      
      // Filter notes for this date based on selected mode
      const dayNotes = notes.filter(note => {
        try {
          const noteDate = dateMode === 'created' ? note.createdAt : note.updatedAt;
          const noteDateKey = new Date(noteDate).toISOString().split('T')[0];
          return noteDateKey === dateKey;
        } catch (error) {
          // Handle invalid dates gracefully
          console.warn('Invalid date for note:', note.id, error);
          return false;
        }
      });
      
      days.push({
        date: new Date(date),
        notes: dayNotes,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime()
      });
    }
    
    return days;
  }, [currentDate, notes, dateMode]);

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleNoteClick = useCallback((noteId: string) => {
    selectNote(noteId);
    onNoteClick(noteId);
  }, [selectNote, onNoteClick]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: colors.background
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={goToPreviousMonth}
            style={{
              background: colors.primary,
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ←
          </button>
          
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            color: colors.text,
            minWidth: '200px',
            textAlign: 'center'
          }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={goToNextMonth}
            style={{
              background: colors.primary,
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            →
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Date Mode Selector */}
          <select
            value={dateMode}
            onChange={(e) => handleDateModeChange(e.target.value as DateMode)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: colors.surface,
              color: colors.text,
              fontSize: '14px'
            }}
          >
            <option value="created">Created Date</option>
            <option value="modified">Modified Date</option>
          </select>

          <button
            onClick={goToToday}
            style={{
              background: colors.secondary,
              color: colors.text,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        background: colors.border,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Day Headers */}
        {dayNames.map(day => (
          <div
            key={day}
            style={{
              background: colors.surface,
              padding: '12px 8px',
              textAlign: 'center',
              fontWeight: 'bold',
              color: colors.textSecondary,
              fontSize: '14px',
              borderBottom: `1px solid ${colors.border}`
            }}
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarData.map((day, index) => (
          <div
            key={index}
            style={{
              background: colors.surface,
              minHeight: '120px',
              padding: '8px',
              border: day.isToday ? `2px solid ${colors.primary}` : 'none',
              opacity: day.isCurrentMonth ? 1 : 0.5,
              position: 'relative'
            }}
          >
            {/* Date Number */}
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: day.isToday ? colors.primary : colors.text,
              marginBottom: '4px'
            }}>
              {day.date.getDate()}
            </div>

            {/* Notes */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              maxHeight: '80px',
              overflow: 'hidden'
            }}>
              {day.notes.slice(0, 3).map(note => (
                <button
                  key={note.id}
                  onClick={() => handleNoteClick(note.id)}
                  style={{
                    background: note.id === selectedNoteId ? colors.primary : colors.background,
                    color: note.id === selectedNoteId ? 'white' : colors.text,
                    border: 'none',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                  title={note.title}
                >
                  {note.title}
                </button>
              ))}
              
              {day.notes.length > 3 && (
                <div style={{
                  fontSize: '10px',
                  color: colors.textSecondary,
                  textAlign: 'center',
                  padding: '2px'
                }}>
                  +{day.notes.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: colors.surface,
        borderRadius: '6px',
        border: `1px solid ${colors.border}`,
        fontSize: '12px',
        color: colors.textSecondary
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: colors.primary,
              borderRadius: '2px'
            }} />
            <span>Selected Note</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              border: `2px solid ${colors.primary}`,
              borderRadius: '2px'
            }} />
            <span>Today</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📅</span>
            <span>Viewing by: {dateMode === 'created' ? 'Creation Date' : 'Modification Date'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView; 