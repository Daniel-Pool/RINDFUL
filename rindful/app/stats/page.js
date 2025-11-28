'use client';
import { useState, useEffect } from 'react';
import Dexie from 'dexie';

let db;
if (typeof window !== 'undefined') {
  db = new Dexie('PlannerDB');
  db.version(1).stores({
    tasks: '++id, date, title, completed'
  });
}

const formatDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLastSevenDays = () => {
  const dates = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i); 
    dates.push(formatDate(date));
  }
  return dates;
};

export default function StatsPage() {
  const [sevenDayCompletedCount, setSevenDayCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const lastSevenDays = getLastSevenDays();

  useEffect(() => {
    const calculateSevenDayProgress = async () => {
      if (!db || typeof window === 'undefined') return;
      
      try {
        const allTasks = await db.tasks
          .where('date')
          .anyOf(lastSevenDays)
          .toArray();

        const completedInSevenDays = allTasks.filter(task => task.completed).length;
        
        setSevenDayCompletedCount(completedInSevenDays);
      } catch (error) {
        console.error('Error calculating 7-day progress:', error);
      } finally {
          setIsLoading(false);
      }
    };

    calculateSevenDayProgress();
  }, []); 

//From Uiverse.io by themrsami but modified
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-900">
    <div
      className="group relative flex w-80 flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20"
    >
    <div
      className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"
    ></div>
    <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>

  <div className="relative">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500"
        >
          <svg
            className="h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            ></path>
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white">User Analytics for the Week</h3>
      </div>
    </div>

    <div className="mb-4 grid grid-cols-2 gap-4">
      <div className="rounded-lg bg-slate-900/50 p-3">
        <p className="text-xs font-medium text-slate-400">Total Task Completed</p>
        <p className="text-lg font-semibold text-white"> {sevenDayCompletedCount}</p>
      </div>
      <div className="rounded-lg bg-slate-900/50 p-3">
        <p className="text-xs font-medium text-slate-400">Average Task Completed Per Day</p>
        <p className="text-lg font-semibold text-white"> {sevenDayCompletedCount / 7}</p>
      </div>

    </div>
  </div>
</div>
</div>
  );
}