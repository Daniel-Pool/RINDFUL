'use client';

import React, { useState } from 'react';
import { exportMoodHistory } from '../utils/moodExport';
import { getTodayString } from './UnifiedCalendar';

export default function MoodExportModal({ isOpen, onClose }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(getTodayString());
  const [format, setFormat] = useState('CSV');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Set default start date to 30 days ago
  React.useEffect(() => {
    if (!startDate) {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setStartDate(`${year}-${month}-${day}`);
    }
  }, [startDate]);

  const handleExport = async () => {
    setError('');
    setSuccess('');
    
    // Validate format selection
    if (!format) {
      setError('Please select an export format (CSV, PDF, or JSON).');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before or equal to end date.');
      return;
    }

    setIsExporting(true);
    
    try {
      const result = await exportMoodHistory(startDate, endDate, format);
      
      setSuccess(`Export successful! File "${result.filename}" has been downloaded.`);
      setTimeout(() => {
        onClose();
        // Reset form after closing
        setError('');
        setSuccess('');
        setIsExporting(false);
      }, 2000);
    } catch (err) {
      let errorMessage = '';
      
      // Handle specific error codes
      switch (err.message) {
        case 'NO_DATA':
          errorMessage = 'No mood data found for the selected date range. Please select a different date range or add mood entries.';
          break;
        case 'MISSING_DATES':
          errorMessage = 'Please select both start and end dates.';
          break;
        case 'INVALID_DATE_RANGE':
          errorMessage = 'Start date must be before or equal to end date.';
          break;
        case 'INVALID_FORMAT':
          errorMessage = 'Please select a valid export format (CSV, PDF, or JSON).';
          break;
        case 'CSV_GENERATION_ERROR':
          errorMessage = 'Failed to generate CSV file. Please try again or select a different format.';
          break;
        case 'PDF_GENERATION_ERROR':
          errorMessage = 'Failed to generate PDF file. Please try again or select a different format.';
          break;
        case 'JSON_GENERATION_ERROR':
          errorMessage = 'Failed to generate JSON file. Please try again or select a different format.';
          break;
        case 'STORAGE_ERROR':
          errorMessage = 'Not enough storage space available. Please free up space and try again.';
          break;
        case 'DOWNLOAD_ERROR':
          errorMessage = 'Failed to download file. Please check your browser settings and try again.';
          break;
        case 'UNKNOWN_ERROR':
        default:
          errorMessage = 'An unexpected error occurred during export. Please try again. If the problem persists, contact support.';
          break;
      }
      
      setError(errorMessage);
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      setError('');
      setSuccess('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Export Mood History</h2>
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {/* Date Range Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Time Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                  disabled={isExporting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={getTodayString()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                  disabled={isExporting}
                />
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Export Format</h3>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="CSV"
                  checked={format === 'CSV'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-gray-700">CSV</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="PDF"
                  checked={format === 'PDF'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-gray-700">PDF</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="JSON"
                  checked={format === 'JSON'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-gray-700">JSON</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !startDate || !endDate}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Exporting...
                </>
              ) : (
                'Export'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

