'use client';

import { useState, useEffect, useRef } from 'react';
import { getDailyEntry } from '../utils/db';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Colors
} from 'chart.js';
import { tw } from '@/utils/colors';
import { stringToDate, getTodayString } from '@/components/UnifiedCalendar';

// register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// helper to get date string in YYYY-MM-DD format
const formatDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// get last 7 days
const getLastSevenDays = (endDateStr) => {
  const dates = [];
  const endDate = stringToDate(endDateStr);
  for (let i = 6; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - i);
    dates.push(formatDate(date));
  }
  return dates;
};
// format date for display
const formatDateLabel = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function StatsPage({ selectedDate = getTodayString() }) {
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedDate) return;
    const loadWeekData = async () => {
      const lastSevenDays = getLastSevenDays(selectedDate);
      const data = [];

      // fetch each day individually (same pattern as PlannerPage)
      for (const date of lastSevenDays) {
        try {
          const entry = await getDailyEntry(date);
          
          if (entry) {
            const validTasks = (entry.tasks || []).filter(t => t != null);
            const completedTasks = validTasks.filter(t => t.completed).length;

            data.push({
              date: date,
              label: formatDateLabel(date),
              mood: entry.mood || 0,
              energy: entry.energy || 0,
              tasksCompleted: completedTasks,
              tasksTotal: validTasks.length,
              wordCount: entry.wordCount || 0
            });
          } else {
            // no entry for this day
            data.push({
              date: date,
              label: formatDateLabel(date),
              mood: 0,
              energy: 0,
              tasksCompleted: 0,
              tasksTotal: 0,
              wordCount: 0
            });
          }
        } catch (error) {
          console.error(`Error loading entry for ${date}:`, error);
        }
      }

      console.log('Week data loaded:', data);
      setWeekData(data);
      setLoading(false);
    };

    loadWeekData();
  }, [selectedDate]);

  // calculate totals
  const totalCompleted = weekData.reduce((sum, day) => sum + day.tasksCompleted, 0);
  const totalWords = weekData.reduce((sum, day) => sum + day.wordCount, 0);
  const avgMood = weekData.filter(d => d.mood > 0).reduce((sum, d) => sum + d.mood, 0) / 
                  Math.max(weekData.filter(d => d.mood > 0).length, 1);
  const avgEnergy = weekData.filter(d => d.energy > 0).reduce((sum, d) => sum + d.energy, 0) / 
                    Math.max(weekData.filter(d => d.energy > 0).length, 1);

  // Chart.js configuration

  // helper function to create a vertical gradient
  const createGradient = (chart, colorStart, colorMid1, colorMid2, colorMid3, colorEnd) => {
    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 240); // gradient from top (y=0) to bottom (y=350)
    gradient.addColorStop(0, colorStart);  // color at the top
    gradient.addColorStop(0.25, colorMid1);
    gradient.addColorStop(0.5, colorMid2);
    gradient.addColorStop(0.75, colorMid3);
    gradient.addColorStop(1, colorEnd);    // color at the bottom
    return gradient;
  };

    const create2Shade = (chart, colorStart, colorEnd) => {
    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 240); // gradient from top (y=0) to bottom (y=350)
    gradient.addColorStop(0, colorStart);  // color at the top
    gradient.addColorStop(1, colorEnd);    // color at the bottom
    return gradient;
  };
  
  // use a ref to store the chart instance
  const chartRef = useRef(null);

  const getChartData = (chart) => {
    if (!chart) return { labels: weekData.map(d => d.label), datasets: [] };

        // Define colors for the gradient
        const amberStart = 'rgba(245, 158, 11, 1)';
        const amberEnd = 'rgba(245, 158, 11, 0.5)';
        const greenStart = 'rgba(34, 197, 94, 1)';
        const greenEnd = 'rgba(34, 197, 94, 0.5)';
        const emeraldStart = 'rgba(16, 185, 129, 1)';
        const emeraldEnd = 'rgba(16, 185, 129, 0.5)';
        const veryLow = 'rgba(128, 128, 128, 1)';    // gray (⚫)
        const low = 'rgba(239, 68, 68, 1)';       // red (🔴)
        const neutral = 'rgba(249, 115, 22, 1)';     // orange (🟠)
        const good = 'rgba(234, 179, 8, 1)';       // yellow (🟡)
        const great = 'rgba(34, 197, 80, 1)';       // green (🟢)
        
        // generate the gradients
        const moodGradient = createGradient(chart, great, good, neutral, low, veryLow);
        const energyGradient = create2Shade(chart, amberStart, veryLow);

        return {
          labels: weekData.map(d => d.label),
          datasets: [
            {
              label: 'Tasks Completed',
              data: weekData.map(d => d.tasksCompleted),
              // assign the gradient to the line color (borderColor)
              borderColor: amberEnd, 
              backgroundColor: 'rgba(245, 158, 11, 0.1)', // keep background for fill
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
            {
              label: 'Mood',
              data: weekData.map(d => d.mood),
              // assign the gradient to the line color (borderColor)
              borderColor: moodGradient,
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
            {
              label: 'Energy',
              data: weekData.map(d => d.energy),
              // Assign the gradient to the line color (borderColor)
              borderColor: energyGradient,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 5,
              pointHoverRadius: 7,
            }
          ]
        };
  };
  const chartData = {
    
    labels: weekData.map(d => d.label),
    datasets: [
      {
        label: 'Tasks Completed',
        data: weekData.map(d => d.tasksCompleted),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Total Tasks',
        data: weekData.map(d => d.tasksTotal),
        borderColor: '#9ca3af',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Mood',
        data: weekData.map(d => d.mood),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Energy',
        data: weekData.map(d => d.energy),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: 'system-ui'
          },
          padding: 15,
          usePointStyle: true,
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="flex flex-col gap-6 px-0">
      <div className="w-full max-w-6xl mx-auto space-y-6">

        {/* Chart */}
        <div id="chart-container-7day-trends" className={`bg-white w-full rounded-lg px-6 border-2 ${tw.border.light}`}>
          <h3 className="text-lg font-bold text-gray-800 mb-0">7-Day Trends</h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-[350px]">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-amber-500"></div>
            </div>
          ) : weekData.length > 0 ? (
            <div className="h-[240px]">
              <Line ref={chartRef} data={getChartData(chartRef.current)} options={chartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
              No data available for the past 7 days
            </div>
          )}
        </div>
      </div>
    </div>
  );
}