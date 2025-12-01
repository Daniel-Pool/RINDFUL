'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEntriesByDateRange, updateMood, updateEnergy, getDailyEntry } from '../utils/db';
import Dexie from 'dexie';
import StreakBadge from '../components/StreakBadge';

// Initialize Dexie database for planner tasks
let plannerDb;
if (typeof window !== 'undefined') {
  plannerDb = new Dexie('PlannerDB');
  plannerDb.version(1).stores({
    tasks: '++id, date, title, completed'
  });
}

export default function WellnessCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState({});
  const [tasksStats, setTasksStats] = useState({}); // { date: { total, done, rate } }
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null); // { date, mood, energy }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEnergy, setSelectedEnergy] = useState(null);
  const [saving, setSaving] = useState(false);

  // Get month start and end dates
  const getMonthRange = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  // Load entries and tasks for current month
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { start, end } = getMonthRange(currentDate);
        
        // Load journal entries (mood/energy)
        const monthEntries = await getEntriesByDateRange(start, end);
        const entriesMap = {};
        monthEntries.forEach(entry => {
          entriesMap[entry.date] = entry;
        });
        setEntries(entriesMap);

        // Load planner tasks
        if (plannerDb && typeof window !== 'undefined') {
          try {
            // Get all tasks for the month
            // Using filter instead of between for better compatibility
            const allTasks = await plannerDb.tasks
              .filter(task => {
                return task.date >= start && task.date <= end;
              })
              .toArray();

            // Group tasks by date and calculate stats
            const statsMap = {};
            allTasks.forEach(task => {
              if (!statsMap[task.date]) {
                statsMap[task.date] = { total: 0, done: 0, rate: 0 };
              }
              statsMap[task.date].total++;
              if (task.completed === true) {
                statsMap[task.date].done++;
              }
            });

            // Calculate rate for each date
            Object.keys(statsMap).forEach(date => {
              const stats = statsMap[date];
              stats.rate = stats.total > 0 
                ? Math.round((stats.done / stats.total) * 100) 
                : 0;
            });

            setTasksStats(statsMap);
          } catch (taskError) {
            console.error('Error loading planner tasks:', taskError);
            setTasksStats({});
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentDate]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Get month name and year
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr
      });
    }
    
    return days;
  };

  // Map mood value (1-5) to display value (0-4)
  const mapMoodToDisplay = (mood) => {
    if (mood === null || mood === undefined) return null;
    return mood - 1; // 1->0, 2->1, 3->2, 4->3, 5->4
  };

  // Map energy value (1-5) to display value (0-4)
  const mapEnergyToDisplay = (energy) => {
    if (energy === null || energy === undefined) return null;
    return energy - 1; // 1->0, 2->1, 3->2, 4->3, 5->4
  };

  // Get mood color
  const getMoodColor = (mood) => {
    const displayMood = mapMoodToDisplay(mood);
    if (displayMood === null) return '#d3d3d3'; // light gray for no data
    const colors = {
      0: '#808080', // gray
      1: '#ef4444', // red
      2: '#f97316', // orange
      3: '#eab308', // yellow
      4: '#22c55e'  // green
    };
    return colors[displayMood] || '#d3d3d3';
  };

  // Handle date click - open modal for editing mood/energy
  const handleDateClick = async (date) => {
    try {
      // Load current entry for this date
      const entry = await getDailyEntry(date);
      setSelectedDay({ date, mood: entry?.mood || null, energy: entry?.energy || null });
      setSelectedMood(entry?.mood || null);
      setSelectedEnergy(entry?.energy || null);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading entry:', error);
      setSelectedDay({ date, mood: null, energy: null });
      setSelectedMood(null);
      setSelectedEnergy(null);
      setIsModalOpen(true);
    }
  };

  // Handle mood selection
  const handleMoodSelect = async (value) => {
    setSelectedMood(value);
    if (selectedDay) {
      setSaving(true);
      try {
        await updateMood(selectedDay.date, value);
        // Update local state
        setEntries(prev => ({
          ...prev,
          [selectedDay.date]: {
            ...(prev[selectedDay.date] || {}),
            date: selectedDay.date,
            mood: value,
            energy: prev[selectedDay.date]?.energy || null
          }
        }));
      } catch (error) {
        console.error('Error updating mood:', error);
        alert('Failed to save mood');
      } finally {
        setSaving(false);
      }
    }
  };

  // Handle energy selection
  const handleEnergySelect = async (value) => {
    setSelectedEnergy(value);
    if (selectedDay) {
      setSaving(true);
      try {
        await updateEnergy(selectedDay.date, value);
        // Update local state
        setEntries(prev => ({
          ...prev,
          [selectedDay.date]: {
            ...(prev[selectedDay.date] || {}),
            date: selectedDay.date,
            energy: value,
            mood: prev[selectedDay.date]?.mood || null
          }
        }));
      } catch (error) {
        console.error('Error updating energy:', error);
        alert('Failed to save energy');
      } finally {
        setSaving(false);
      }
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDay(null);
    setSelectedMood(null);
    setSelectedEnergy(null);
  };

  // Navigate to planner
  const handleGoToPlanner = () => {
    if (selectedDay) {
      router.push(`/planner?date=${selectedDay.date}`);
    }
  };

  // Mood options (value 1-5, display 0-4)
  const moodOptions = [
    { value: 1, display: 0, color: '#808080', label: '0 - Very Low' },
    { value: 2, display: 1, color: '#ef4444', label: '1 - Low' },
    { value: 3, display: 2, color: '#f97316', label: '2 - Neutral' },
    { value: 4, display: 3, color: '#eab308', label: '3 - Good' },
    { value: 5, display: 4, color: '#22c55e', label: '4 - Great' }
  ];

  // Energy options (value 1-5, display 0-4) - same emojis as Dashboard
  const energyOptions = [
    { value: 1, display: 0, emoji: '💤', label: 'Exhausted' },
    { value: 2, display: 1, emoji: '😴', label: 'Low Energy' },
    { value: 3, display: 2, emoji: '🟡', label: 'Okay' },
    { value: 4, display: 3, emoji: '⚡', label: 'Energetic' },
    { value: 5, display: 4, emoji: '🔥', label: 'Very Energized' }
  ];

  const calendarDays = getCalendarDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Mood legend data
  const moodLegend = [
    { value: 0, color: '#808080', label: '0' },
    { value: 1, color: '#ef4444', label: '1' },
    { value: 2, color: '#f97316', label: '2' },
    { value: 3, color: '#eab308', label: '3' },
    { value: 4, color: '#22c55e', label: '4' }
  ];

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#fffbeb' }}>
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Wellness Calendar</h1>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={handlePrevMonth}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xl font-bold rounded-lg transition-colors border border-gray-300 min-w-[50px]"
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 className="text-2xl font-semibold text-gray-800 min-w-[200px] text-center">
            {monthName} {year}
          </h2>
          <button
            onClick={handleNextMonth}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xl font-bold rounded-lg transition-colors border border-gray-300 min-w-[50px]"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading calendar...</div>
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            {/* Legend */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                {/* left side: mood & energy */}
                <div className="flex flex-col gap-4">
                  {/* Mood legend */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Mood level:</span>
                    {moodLegend.map((item) => (
                      <div key={item.value} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600">{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Energy legend */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">⚡ Energy level:</span>
                    {energyOptions.map((item) => (
                      <div key={item.value} className="flex items-center gap-2">
                        <span className="text-base">{item.emoji}</span>
                        <span className="text-sm text-gray-600">{item.display}</span>
                      </div>
                    ))}
                  </div>
                </div>

              {/* right side: streak badge */}
              <StreakBadge refreshKey={0} />
            </div>
          </div>

            <div className="grid grid-cols-7 gap-2 mb-8">
              {/* Day names header */}
              {dayNames.map((dayName) => (
                <div
                  key={dayName}
                  className="text-center font-semibold text-gray-700 py-2"
                >
                  {dayName}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const entry = entries[day.date];
                const mood = entry?.mood;
                const energy = entry?.energy;
                const displayMood = mapMoodToDisplay(mood);
                const displayEnergy = mapEnergyToDisplay(energy);
                const moodColor = getMoodColor(mood);
                const stats = tasksStats[day.date] || { total: 0, done: 0, rate: 0 };

                // Build tooltip text
                let tooltipText = '';
                if (displayMood !== null) {
                  tooltipText = `Mood: ${displayMood}`;
                } else {
                  tooltipText = 'No mood data';
                }
                if (stats.total > 0) {
                  tooltipText += `\nTasks: ${stats.done}/${stats.total} (${stats.rate}%)`;
                }

                // Calculate progress percentage
                const progressPercentage = stats.total > 0 
                  ? (stats.done / stats.total) * 100 
                  : 0;

                return (
                  <div
                    key={day.date}
                    onClick={() => handleDateClick(day.date)}
                    className="aspect-square border border-gray-200 rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition-colors relative flex flex-col items-center justify-center overflow-hidden"
                    title={tooltipText}
                  >
                    {/* Day number in top right */}
                    <div className="absolute top-2 right-2 text-sm text-gray-600">
                      {day.day}
                    </div>

                    {/* Mood dot in center */}
                    <div
                      className="w-3 h-3 rounded-full mb-1"
                      style={{ backgroundColor: moodColor }}
                    />

                    {/* Energy level below dot */}
                    {energy !== null && energy !== undefined && (
                      <div className="text-xs text-gray-600 mb-0.5">
                        {energyOptions.find(e => e.value === energy)?.emoji || '⚡'}
                      </div>
                    )}

                    {/* Task progress below energy */}
                    {stats.total > 0 && (
                      <div className="text-xs text-gray-600">
                        {stats.done}/{stats.total} ({stats.rate}%)
                      </div>
                    )}

                    {/* Progress bar at the bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-200 rounded-b-lg">
                      {stats.total > 0 && (
                        <div
                          className="h-full bg-blue-500 rounded-b-lg transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal for editing mood/energy */}
        {isModalOpen && selectedDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {new Date(selectedDay.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Mood Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Mood Level</h3>
                <div className="flex gap-2 justify-center">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => handleMoodSelect(mood.value)}
                      disabled={saving}
                      className={`w-12 h-12 rounded-full transition-all ${
                        selectedMood === mood.value
                          ? 'ring-4 ring-gray-400 scale-110'
                          : 'opacity-60 hover:opacity-100'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{ backgroundColor: mood.color }}
                      title={mood.label}
                    />
                  ))}
                </div>
                {selectedMood && (
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Selected: {moodOptions.find(m => m.value === selectedMood)?.label}
                  </p>
                )}
              </div>

              {/* Energy Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {selectedEnergy ? 'Your energy today:' : '⚡ Energy Level'}
                </h3>
                <div className="flex gap-3 justify-center">
                  {energyOptions.map((energy) => (
                    <button
                      key={energy.value}
                      onClick={() => handleEnergySelect(energy.value)}
                      disabled={saving}
                      className={`text-3xl transition transform ${
                        selectedEnergy === energy.value
                          ? 'opacity-100 drop-shadow scale-110'
                          : 'opacity-50 hover:opacity-100 hover:scale-110'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={energy.label}
                    >
                      {energy.emoji}
                    </button>
                  ))}
                </div>
                {selectedEnergy && (
                  <p className="text-sm text-gray-600 text-center mt-2">
                    You selected: {energyOptions.find(e => e.value === selectedEnergy)?.label}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleGoToPlanner}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                  Go to Planner
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

