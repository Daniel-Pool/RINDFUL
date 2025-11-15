'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Dexie from 'dexie';

// Initialize Dexie database
let db;
if (typeof window !== 'undefined') {
  db = new Dexie('PlannerDB');
  db.version(1).stores({
    tasks: '++id, date, title, completed'
  });
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PlannerPage() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Update selected date from URL parameter on mount and when it changes
  useEffect(() => {
    const urlDate = searchParams?.get('date');
    if (urlDate) {
      setSelectedDate(urlDate);
    }
  }, [searchParams]);

  // Load tasks for the selected date
  const loadTasks = async () => {
    if (!db || typeof window === 'undefined') return;
    try {
      setLoading(true);
      const dateTasks = await db.tasks
        .where('date')
        .equals(selectedDate)
        .toArray();
      // Sort tasks: incomplete first, then completed
      const sortedTasks = dateTasks.sort((a, b) => {
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

  // Add a new task
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !db || typeof window === 'undefined') return;

    try {
      const newTask = {
        date: selectedDate,
        title: newTaskTitle.trim(),
        completed: false
      };

      const id = await db.tasks.add(newTask);
      const updatedTasks = [...tasks, { ...newTask, id }];
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
    if (!db || typeof window === 'undefined') return;
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await db.tasks.update(taskId, { completed: !task.completed });
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
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
    if (!db || typeof window === 'undefined') return;
    try {
      await db.tasks.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
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
    if (!editingTaskTitle.trim() || !db || typeof window === 'undefined') return;
    try {
      await db.tasks.update(taskId, { title: editingTaskTitle.trim() });
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, title: editingTaskTitle.trim() } : t
      );
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
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Daily Planner</h1>
        
        {/* Date Picker */}
        <div className="mb-6">
          <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
          />
        </div>

        {/* Add Task Section */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a new task..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
            />
            <button
              onClick={handleAddTask}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Progress Section */}
        {!loading && tasks.length > 0 && (
          <div className="mb-4 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Daily Progress:
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {completedCount} / {totalCount} completed ({progressPercentage}%)
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No tasks for this date. Add one above!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task.id)}
                    className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                    disabled={editingTaskId === task.id}
                  />
                  {editingTaskId === task.id ? (
                    <input
                      type="text"
                      value={editingTaskTitle}
                      onChange={(e) => setEditingTaskTitle(e.target.value)}
                      onKeyDown={(e) => handleEditKeyPress(e, task.id)}
                      className="flex-1 px-3 py-1 border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`flex-1 ${
                        task.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-800'
                      }`}
                    >
                      {task.title}
                    </span>
                  )}
                  <div className="flex gap-2">
                    {editingTaskId === task.id ? (
                      <>
                        <button
                          onClick={() => handleSaveTask(task.id)}
                          className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                          aria-label="Save task"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                          aria-label="Cancel edit"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleChangeTask(task.id, task.title)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          aria-label="Change task"
                        >
                          Change task
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
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

