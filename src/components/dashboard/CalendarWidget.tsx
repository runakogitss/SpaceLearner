import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStudyStore } from '../../store/useStudyStore';

export const CalendarWidget: React.FC = () => {
  const { analyticsSessions } = useStudyStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Calculate real-time calendar grid dates
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  
  // Day of week index (0 = Sun, 1 = Mon ... 6 = Sat). Convert so Mon = 0.
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const realToday = new Date();
  const isCurrentRealMonth = 
    realToday.getFullYear() === year && 
    realToday.getMonth() === month;
  const todayDate = realToday.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build Calendar Cells
  const calendarCells = [];

  // Trailing days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: false,
      hasSession: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = isCurrentRealMonth && d === todayDate;
    
    // Check if user completed a session on this date
    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasSession = analyticsSessions.some(s => {
      if (!s.is_completed) return false;
      if (s.completed_at && s.completed_at.includes('T')) {
        return s.completed_at.split('T')[0] === cellDateStr;
      }
      return isToday && analyticsSessions.length > 0;
    });

    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      isToday,
      hasSession
    });
  }

  // Next month leading days to complete grid (total cells multiple of 7)
  const remainingCells = 35 - calendarCells.length;
  for (let n = 1; n <= (remainingCells > 0 ? remainingCells : (42 - calendarCells.length)); n++) {
    calendarCells.push({
      day: n,
      isCurrentMonth: false,
      isToday: false,
      hasSession: false
    });
  }

  return (
    <div className="bg-cosmic-card/90 border border-cosmic-border rounded-3xl p-5 shadow-glow-card mb-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold font-outfit text-white tracking-wide uppercase">
          REAL-TIME CALENDAR
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-purple-300 min-w-24 text-center">
            {monthName}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 text-center mb-2">
        {daysOfWeek.map((day, idx) => (
          <span key={idx} className="text-[10px] font-semibold text-cosmic-textMuted">
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarCells.map((item, idx) => (
          <div
            key={idx}
            className={`h-8 flex flex-col items-center justify-center rounded-xl text-xs font-medium relative transition-all ${
              !item.isCurrentMonth
                ? 'text-slate-600'
                : item.isToday
                ? 'bg-purple-600 text-white font-extrabold shadow-glow-purple border border-purple-300/40 ring-2 ring-purple-400/30'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <span>{item.day}</span>
            {item.hasSession && !item.isToday && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 absolute bottom-1" />
            )}
          </div>
        ))}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center gap-2 justify-center text-[10px] text-cosmic-textMuted mt-3 pt-3 border-t border-white/5">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
        <span>Days with focus sessions</span>
      </div>
    </div>
  );
};
