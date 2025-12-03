'use client';

import { useState } from 'react';
import { deleteConfirmation } from './deleteAccount';
import { downloadCSV, downloadJSON, downloadPDF } from '../utils/exportData';
import MoodExportModal from '../components/MoodExportModal';

export default function SettingPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [isMoodExportModalOpen, setIsMoodExportModalOpen] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      setExportMessage('Exporting to CSV...');
      await downloadCSV(`rindful_data_${new Date().toISOString().split('T')[0]}.csv`);
      setExportMessage('CSV exported successfully!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (error) {
      console.error('CSV export error:', error);
      setExportMessage('Error exporting CSV. Please try again.');
      setTimeout(() => setExportMessage(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      setExportMessage('Exporting to JSON...');
      await downloadJSON(`rindful_data_${new Date().toISOString().split('T')[0]}.json`);
      setExportMessage('JSON exported successfully!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (error) {
      console.error('JSON export error:', error);
      setExportMessage('Error exporting JSON. Please try again.');
      setTimeout(() => setExportMessage(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      setExportMessage('Exporting to PDF...');
      
      // Try to find the chart container or canvas element from the dashboard
      // Priority: chart container > canvas element
      const chartContainer = document.getElementById('chart-container-7day-trends');
      const chartElement = chartContainer || document.querySelector('canvas');
      
      await downloadPDF(chartElement, `rindful_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setExportMessage('PDF exported successfully!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (error) {
      console.error('PDF export error:', error);
      setExportMessage('Error exporting PDF. Please try again.');
      setTimeout(() => setExportMessage(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>

        {/* Mood History Export Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Export Mood History</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Export your mood history over a selected time period. Perfect for sharing with healthcare professionals.
          </p>
          <button
            onClick={() => setIsMoodExportModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded transition-colors"
          >
            📊 Export Mood History
          </button>
        </div>

        {/* Export Data Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Export Your Data</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Export your journal entries, mood/energy data, tasks, and 7-day trends in various formats.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className={`bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded transition-colors ${
                isExporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              📊 Export to CSV
            </button>
            
            <button
              onClick={handleExportJSON}
              disabled={isExporting}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded transition-colors ${
                isExporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              📄 Export to JSON
            </button>
            
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded transition-colors ${
                isExporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              📑 Export to PDF (with 7-Day Trends)
            </button>
          </div>

          {exportMessage && (
            <div className={`mt-4 p-3 rounded ${
              exportMessage.includes('Error') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {exportMessage}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4">
            💡 Tip: For PDF export with charts, make sure you have the dashboard open with the 7-Day Trends visible.
          </p>
        </div>

        {/* Delete Data Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Danger Zone</h2>
          <button
            onClick={deleteConfirmation}
            className="bg-transparent hover:bg-red-500 text-red-700 font-semibold hover:text-white py-2 px-4 border border-red-500 hover:border-transparent rounded transition-colors"
          >
            Delete My Data
          </button>
        </div>
      </div>

      {/* Mood Export Modal */}
      <MoodExportModal 
        isOpen={isMoodExportModalOpen} 
        onClose={() => setIsMoodExportModalOpen(false)} 
      />
    </div>
  );
}

