'use client';

import color, { tw } from '@/utils/colors.js'
import { useState, useEffect } from 'react';
import { getPlannerTasksByDate, updatePlannerTasks, getEntriesByDateRange } from "../utils/db";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

//Get Seven Days
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

export default function PlannerPage( { selectedDate } ) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [sevenDayCompletedCount, setSevenDayCompletedCount] = useState(0);

  // Load tasks for the selected date
  const loadTasks = async () => {
    if (!selectedDate) return;
    try {
      setLoading(true);
      let dateTasks = await getPlannerTasksByDate(selectedDate);
      if (!Array.isArray(dateTasks)) dateTasks = [];

      // Sort tasks: incomplete first, then completed
      const validTasks = dateTasks.filter(task => task != null
         && typeof task === 'object' &&
        task.id != null);
      const sortedTasks = validTasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks when date changes
  useEffect(() => {
    loadTasks();
  }, [selectedDate]);

  // calculate 7-day statistics
  useEffect(() => {
    const calculateSevenDayProgress = async () => {
      
      const lastSevenDays = getLastSevenDays();
      const startDate = lastSevenDays[0];
      const endDate = lastSevenDays[lastSevenDays.length - 1];

      
      try {
          const entries = await getEntriesByDateRange(startDate, endDate);
          let totalCompleted = 0;
          entries.forEach(entry => {
            if(entry.tasks && Array.isArray(entry.tasks)) {
              totalCompleted += entry.tasks.filter(task => task && task.completed).length;
            }
          });
        setSevenDayCompletedCount(totalCompleted);
      } catch (error) {
        console.error('Error calculating 7-day progress:', error);
      }
    };

    calculateSevenDayProgress();
  }, [tasks]);

const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
};

useEffect(() => {
        const handleDailyReset = async () => {
            
            const today = getTodayDate();
            const lastSevenDays = getLastSevenDays();
            const startDate = lastSevenDays[0];

            try {

                const oldIncompleteTasks = await getEntriesByDateRange(startDate, today);
                for (const entry of oldIncompleteTasks) {
                  if (entry.date < today && entry.tasks && Array.isArray(entry.tasks)) {
                    const oldIncompleteTasks = entry.tasks.filter(task => task && !task.completed);
                    if (oldIncompleteTasks.length > 0) {
                        console.log(`Deleting ${oldIncompleteTasks.length} old incomplete tasks.`);
                        const idsToDelete = entry.tasks.filter(task => task.completed);
                        await updatePlannerTasks(entry.date, idsToDelete);
                    }
                  }
                }

            } catch (error) {
                console.error('Error during daily reset/cleanup:', error);
            }
        };

        handleDailyReset();
    }, []);

  // Add a new task
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const newTask = {
        date: selectedDate,
        title: newTaskTitle.trim(),
        completed: false,
        id: Date.now()
      };

      const updatedTasks = [...tasks, { ...newTask, id: Date.now() }];
      await updatePlannerTasks(selectedDate, updatedTasks);
      // Sort tasks: incomplete first, then completed
      const sortedTasks = updatedTasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
      setTasks(sortedTasks);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };


  
  // Toggle task completion
  const handleToggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTasks = validTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t).filter(task => task != null);
      await updatePlannerTasks(selectedDate, updatedTasks);
      // Sort tasks: incomplete first, then completed
      const sortedTasks = updatedTasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    try {
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      await updatePlannerTasks(selectedDate, updatedTasks);
      setTasks(updatedTasks);
      if (editingTaskId === taskId) {
        setEditingTaskId(null);
        setEditingTaskTitle('');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Start editing a task
  const handleChangeTask = (taskId, currentTitle) => {
    setEditingTaskId(taskId);
    setEditingTaskTitle(currentTitle);
  };

  // Save edited task
  const handleSaveTask = async (taskId) => {
    try {
      const updatedTasks = validTasks.map(t => t.id === taskId ? { ...t, title: editingTaskTitle.trim() } : t).filter(task => task != null);
      await updatePlannerTasks(selectedDate, updatedTasks);
      setTasks(updatedTasks);
      setEditingTaskId(null);
      setEditingTaskTitle('');
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  // Handle Enter key in edit input
  const handleEditKeyPress = (e, taskId) => {
    if (e.key === 'Enter') {
      handleSaveTask(taskId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Handle Enter key in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  // Calculate progress
  const validTasks = tasks.filter(t => t != null);
  const completedCount = validTasks.filter(t => t.completed).length;
  const totalCount = validTasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`flex flex-col gap-1 p-1 w-full h-full`}>
      <h2 className={`text-3lg font-bold mb-1 ${tw.text.tertiary}`}>Daily Planner</h2>
      <div className={`w-full flex flex-col`}>

        {/* 7-Day Statistics */}
        <div className={`${tw.bg.mainLight} rounded-lg p-4 border ${tw.border.light}`}>
          <h3 className={`text-sm font-semibold ${tw.text.quaternary} mb-3`}>Weekly Stats</h3>
          <div className={`grid grid-cols-2 gap-3`}>
            <div className={`bg-white rounded-lg p-3 shadow-sm`}>
              <p className={`text-xs font-medium ${tw.text.tertiary}`}>Total Completed</p>
              <p className={`text-2xl font-bold ${tw.text.brand}`}>{sevenDayCompletedCount}</p>
            </div>
            <div className={`bg-white rounded-lg p-3 shadow-sm`}>
              <p className={`text-xs font-medium ${tw.text.tertiary}`}>Daily Average</p>
              <p className={`text-2xl font-bold ${tw.text.brand}`}>
                {(sevenDayCompletedCount / 7).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {!loading && tasks.length > 0 && (
          <div className={`mb-4 bg-white rounded-lg shadow p-4`}>
            <div className={`flex items-center justify-between`}>
              <span className={`text-sm font-medium ${tw.text.quaternary}`}>
                Daily Progress:
              </span>
              <span className={`text-sm font-semibold ${tw.text.primary}`}>
                {completedCount} / {totalCount} completed ({progressPercentage}%)
              </span>
            </div>
            <div className={`mt-2 w-full bg-gray-200 rounded-full h-2`}>
              <div
                className={`bg-orange-500 h-2 rounded-full transition-all duration-300`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Add Task Section */}
        <div className={`mb-6 ${tw.bg.card} rounded-lg shadow p-4`}>
          <div className={`flex gap-2`}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a new task..."
              className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black`}
            />
            <button
              onClick={handleAddTask}
              className={`px-6 py-2 ${tw.button.tertiary} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors`}
            >
              Add
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className={`${tw.bg.card} rounded-lg shadow flex-shrink-0`}>
          {loading ? (
            <div className={`p-6 text-center ${tw.text.tertiary}`}>Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className={`p-6 text-center ${tw.text.tertiary}`}>
              No tasks for this date. Add one above!
            </div>
          ) : (
            <ul className={`divide-y divide-gray-200 max-h-[400px] overflow-y-auto`}>
              {tasks.filter(task => task != null).map((task) => (
                <li
                  key={task.id}
                  className={`p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task.id)}
                    className={`w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer`}
                    disabled={editingTaskId === task.id}
                  />
                  {editingTaskId === task.id ? (
                    <input
                      style={{maxWidth: 180}}
                      type="text"
                      value={editingTaskTitle}
                      onChange={(e) => setEditingTaskTitle(e.target.value)}
                      onKeyDown={(e) => handleEditKeyPress(e, task.id)}
                      className={`flex-1 px-3 py-1 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black`}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`flex-1 ${
                        task.completed
                          ? `line-through ${tw.text.light}`
                          : `${tw.text.light}`
                      }`}
                    >
                      {task.title}
                    </span>
                  )}
                  <div className={`flex gap-2`}>
                    {editingTaskId === task.id ? (
                      <>
                        <button
                          onClick={() => handleSaveTask(task.id)}
                          className={`px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors`}
                          aria-label="Save task"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={`px-3 py-1 text-sm ${tw.text.secondary} hover:${tw.text.primary} hover:bg-gray-50 rounded transition-colors`}
                          aria-label="Cancel edit"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleChangeTask(task.id, task.title)}
                          className={`px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors`}
                          aria-label="Change task"
                        >
                          Change task
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className={`px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors`}
                          aria-label="Delete task"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

