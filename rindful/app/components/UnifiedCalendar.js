'use client';

import { useState, useEffect, useMemo } from 'react';
import { getEntriesByDateRange } from '../utils/db';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const dateToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const stringToDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateHeader = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
};

export default function UnifiedCalendar({ selectedDate, onDateSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);

  // always calculate the full month grid
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun, 6 = Sat

    // previous month's data
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    const grid = [];
    

    // leading overflow days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dateObj = new Date(prevMonthYear, prevMonth, daysInPrevMonth - i);
      grid.push({
        day: dateObj.getDate(),
        date: dateToString(dateObj),
        dateObj,
        inCurrentMonth: false,
      });
    }

    // current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      grid.push({
        day,
        date: dateToString(dateObj),
        dateObj,
        inCurrentMonth: true,
      });
    }

    // trailing overflow days for next month to fill out grid (5 or 6 weeks)
    const totalCells = ((grid.length - 30) > 5) ? 42 : 35; // 5x7 if there are less than 5 remaining overflow days, 6x7 otherwise
    const trailingDays = totalCells - grid.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= trailingDays; i++) {
      const dateObj = new Date(nextMonthYear, nextMonth, i);
      grid.push({
        day: dateObj.getDate(),
        date: dateToString(dateObj),
        dateObj,
        inCurrentMonth: false,
      });
    }

    // week calculation remains the same, but adjusts for overflow
    const referenceDate = selectedDate || dateToString(currentDate);
    let weekStartIndex = grid.findIndex(d =>
      d.date === referenceDate
    );
    weekStartIndex = Math.floor(weekStartIndex / 7) * 7;
    const currentWeek = grid.slice(weekStartIndex, weekStartIndex + 7);

    const gridFirst = grid[0].date;
    const gridLast = grid[grid.length - 1].date;

    return {
      start: gridFirst,
      end: gridLast,
      allDays: grid,
      currentWeek,
      weekStartIndex
    };
  }, [currentDate, selectedDate]);
  // load entries for current month
  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      try {
        const { start, end } = calendarData;
        const monthEntries = await getEntriesByDateRange(start, end);
        
        const entriesMap = {};
        monthEntries.forEach(entry => {
          entriesMap[entry.date] = entry;
        });
        setEntries(entriesMap);
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [calendarData]);

  // navigation handlers
  const handlePrev = () => {
    if (!isExpanded) {
      // week view, go back 7 days
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
      if (onDateSelect) onDateSelect(dateToString(newDate));
    } else {
      // month view, go to previous month
      const targetMonth = currentDate.getMonth() - 1;
      const targetYear = currentDate.getFullYear();
      // clamp day to valid range in target month
      const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      const targetDay = Math.min(currentDate.getDate(), maxDay);
      const newDate = new Date(targetYear, targetMonth, targetDay);
      setCurrentDate(newDate);
      if (onDateSelect) onDateSelect(dateToString(newDate));
    }
  };

  const handleNext = () => {
    if (!isExpanded) {
      // week view, go forward 7 days
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
      if (onDateSelect) onDateSelect(dateToString(newDate));
    } else {
      // month view, go to next month
      const targetMonth = currentDate.getMonth() + 1;
      const targetYear = currentDate.getFullYear();
      const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      const targetDay = Math.min(currentDate.getDate(), maxDay);
      const newDate = new Date(targetYear, targetMonth, targetDay);
      setCurrentDate(newDate);
      if (onDateSelect) onDateSelect(dateToString(newDate));
    }
  };

  // handle date selection
  const handleDateClick = (date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
    
    const [year, month, day] = date.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    setCurrentDate(selectedDateObj);
  };

  // toggle expand/collapse
  const toggleExpanded = () => {
    if (isExpanded) {
      // start collapsing, trigger height change first
      setIsCollapsing(true);
      // use requestAnimationFrame to ensure the height change is applied
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // this triggers the CSS transition
          setIsCollapsing(true);
        });
      });
      // after animation completes, change the view
      setTimeout(() => {
        setIsExpanded(false);
        setIsCollapsing(false);
      }, 500);
    } else {
      setIsExpanded(true);
      setIsCollapsing(false);
    }
  };

  // helper functions
  const mapMoodToDisplay = (mood) => {
    if (mood === null || mood === undefined) return null;
    return mood - 1;
  };

  const getMoodColor = (mood) => {
    const displayMood = mapMoodToDisplay(mood);
    if (displayMood === null) return '#d3d3d3';
    const colors = {
      0: '#808080',
      1: '#ef4444',
      2: '#f97316',
      3: '#eab308',
      4: '#22c55e'
    };
    return colors[displayMood] || '#d3d3d3';
  };

  const getEnergyEmoji = (energy) => {
    const emojis = {
      1: '💤',
      2: '😴',
      3: '🟡',
      4: '⚡',
      5: '🔥'
    };
    return emojis[energy] || null;
  };

  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // render a single day cell
  const renderDayCell = (dayData, index) => {
    if (!dayData) {
      return <div key={`empty-${index}`} className="aspect-square" />;
    }

    const { day, date, dateObj, inCurrentMonth } = dayData;
    const entry = entries[date];
    const isToday = dateObj.toDateString() === today.toDateString();
    const isSelected = selectedDate === date;
    const isFuture = dateObj > today;

    // overflow dates are faded out
    const extraClass = inCurrentMonth ? '' : 'text-gray-100 opacity-40';

    const mood = entry?.mood;
    const energy = entry?.energy;
    const moodColor = getMoodColor(mood);
    const energyEmoji = getEnergyEmoji(energy);

    const bgClass = isToday
      ? 'bg-emerald-400 text-white'
      : isFuture
      ? 'bg-white text-gray-800'
      : 'bg-amber-100 text-gray-800';

    return (
      <button
        key={date}
        onClick={() => handleDateClick(date)}
        className={`scale-80 aspect-square p-2 rounded-lg transition-all cursor-pointer hover:scale-85 hover:shadow-md flex flex-col items-center justify-center relative shadow-sm ${bgClass} ${
          isSelected ? 'ring-4 ring-blue-500' : ''
        } ${extraClass}`}
        type="button"
      >
        <span className="text-base font-semibold mb-1">{day}</span>
        {mood && (
          <div
            className="w-2.5 h-2.5 rounded-full mb-0.5"
            style={{ backgroundColor: moodColor }}
          />
        )}
        {energy && <span className="text-xs">{energyEmoji}</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[140px] max-h-[140px]">
      {/* calendar container with absolute positioning to overlay content below */}

      <div className="bg-amber-50 rounded-lg shadow-lg w-full max-w-5xl transition-all duration-500 ease-out, my-13" 
        style={{ position: 'absolute', zIndex: 50, top: '0' }}>
        
        {/* fixed-height header and week view section */}
        <div className="p-0">
          {/* navigation buttons */}
          <div className="flex items-center w-full relative mb-0">
            {/* left navigation button */}
            <button
              onClick={handlePrev}
              className="px-4 py-0 bg-white text-gray-800 hover:bg-gray-100 rounded-lg font-bold transition-colors shadow-sm"
              type="button"
            >
              ←
            </button>
            
            {/* date/month text and expansion button */}
            <div className="flex-1 flex justify-center relative" style={{ minWidth: "320px" }}>
              <h3 className="text-xl font-bold text-gray-800 text-center">
                {isExpanded 
                  ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : formatDateHeader(selectedDate)
                }
              </h3>
              <button
                onClick={toggleExpanded}
                className="absolute right-55 top-1/2 -translate-y-1/2 px-3 py-1 bg-white hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-800" /> : <ChevronDown className="w-4 h-4 text-gray-800" />}
              </button>
            </div>
            
            {/* right navigation button */}
            <button
              onClick={handleNext}
              className="px-4 py-0 bg-white text-gray-800 hover:bg-gray-100 rounded-lg font-bold transition-colors shadow-sm"
              type="button"
            >
              →
            </button>
          </div>

          {/* day names header */}
          <div className="grid grid-cols-7 gap-8 px-0 mb-0">
            {dayNames.map((dayName) => (
              <div
                key={dayName}
                className="text-center font-semibold text-gray-700 py-0 text-sm"
              >
                {dayName}
              </div>
            ))}
          </div>
        </div>

        {/* expandable calendar grid section */}
        <div 
          className=" x-6 pb-6 transition-all duration-500 ease-in-out overflow-hidden"
          style={{
            maxHeight: (isExpanded && !isCollapsing) ? '875px' : '115px'
          }}
        >
          <div className="grid grid-cols-7 gap-8">
            {/* show full month while expanded, show week only when fully collapsed */}
            {isExpanded
              ? calendarData.allDays.map((dayData, index) => renderDayCell(dayData, index))
              : calendarData.currentWeek.map((dayData, index) => renderDayCell(dayData, index))
            }
          </div>
        </div>
      </div>

      <style jsx>{`
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 500ms;
        }
      `}</style>
    </div>
  );
}