// Mood History Export Utility - Simplified Version
// Exports only: date, time, mood rating, and mood label
import { getMoodEntriesByDateRange } from './db';
import jsPDF from 'jspdf';

// Helper to get mood label
const getMoodLabel = (moodValue) => {
  const moodMap = { 
    1: 'Very Low', 
    2: 'Low', 
    3: 'Neutral', 
    4: 'Good', 
    5: 'Great' 
  };
  return moodMap[moodValue] || 'N/A';
};

// Format timestamp to time string
const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Calculate summary statistics
const calculateSummary = (entries) => {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      dateRange: 'N/A',
      averageMood: 0,
      moodDistribution: {},
      daysWithData: 0
    };
  }

  const moods = entries.map(e => e.mood).filter(m => m != null);
  const averageMood = moods.length > 0 
    ? (moods.reduce((sum, m) => sum + m, 0) / moods.length).toFixed(2)
    : 0;

  const moodDistribution = {};
  moods.forEach(mood => {
    const label = getMoodLabel(mood);
    moodDistribution[label] = (moodDistribution[label] || 0) + 1;
  });

  const uniqueDates = new Set(entries.map(e => e.date));
  
  const startDate = entries[0]?.date || '';
  const endDate = entries[entries.length - 1]?.date || '';

  return {
    totalEntries: entries.length,
    dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    averageMood: parseFloat(averageMood),
    moodDistribution,
    daysWithData: uniqueDates.size,
    startDate,
    endDate
  };
};

// Escape CSV cell content
const escapeCSVCell = (cell) => {
  if (cell === null || cell === undefined) return '';
  const str = String(cell);
  // Escape quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  // Wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${escaped}"`;
  }
  return str;
};

// Export to CSV - Only date, time, mood rating, mood label
export const exportMoodHistoryToCSV = async (startDate, endDate) => {
  try {
    const entries = await getMoodEntriesByDateRange(startDate, endDate);
    
    if (entries.length === 0) {
      throw new Error('NO_DATA');
    }

    const summary = calculateSummary(entries);
    
    // CSV headers - only essential fields
    const headers = ['Date', 'Time', 'Mood Rating', 'Mood Label'];

    // Build CSV rows
    const rows = entries.map(entry => {
      const row = [
        entry.date,
        formatTime(entry.timestamp),
        entry.mood || '',
        getMoodLabel(entry.mood)
      ];

      return row.map(escapeCSVCell).join(',');
    });

    // Build complete CSV with summary
    let csvContent = 'MOOD HISTORY EXPORT - SUMMARY\n';
    csvContent += '============================\n';
    csvContent += `Date Range: ${summary.dateRange}\n`;
    csvContent += `Total Entries: ${summary.totalEntries}\n`;
    csvContent += `Days with Data: ${summary.daysWithData}\n`;
    csvContent += `Average Mood Rating: ${summary.averageMood}/5\n`;
    csvContent += '\nMood Distribution:\n';
    Object.entries(summary.moodDistribution).forEach(([label, count]) => {
      csvContent += `  ${label}: ${count}\n`;
    });
    
    csvContent += '\n\n';
    csvContent += 'RAW DATA\n';
    csvContent += '========\n';
    csvContent += headers.map(escapeCSVCell).join(',') + '\n';
    csvContent += rows.join('\n');

    return csvContent;
  } catch (error) {
    if (error.message === 'NO_DATA') {
      throw new Error('NO_DATA');
    }
    console.error('CSV export error:', error);
    throw new Error('CSV_GENERATION_ERROR');
  }
};

// Export to PDF - Professional layout with only essential fields
export const exportMoodHistoryToPDF = async (startDate, endDate) => {
  try {
    const entries = await getMoodEntriesByDateRange(startDate, endDate);
    
    if (entries.length === 0) {
      throw new Error('NO_DATA');
    }

    const summary = calculateSummary(entries);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const headerHeight = 25;
    const footerHeight = 15;
    let yPosition = margin + headerHeight;

    // Helper to check if new page needed
    const checkNewPage = (requiredHeight) => {
      if (yPosition + requiredHeight > pageHeight - footerHeight) {
        pdf.addPage();
        yPosition = margin + headerHeight;
        return true;
      }
      return false;
    };

    // Draw header on each page
    const drawHeader = (pageNum) => {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(249, 115, 22); // Orange color
      pdf.text('RINDFUL', margin, 15);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Mood History Export', pageWidth - margin, 15, { align: 'right' });
      
      // Draw line under header
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(margin, 18, pageWidth - margin, 18);
    };

    // Draw footer on each page
    const drawFooter = (pageNum, totalPages) => {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${pageNum} of ${totalPages} | Generated by RINDFUL | ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    };

    // Draw header on first page
    drawHeader(1);

    // Title Section
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Mood History Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Date Range: ${summary.dateRange}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Summary Section
    checkNewPage(30);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Summary', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const summaryLines = [
      `Total Entries: ${summary.totalEntries}`,
      `Days with Data: ${summary.daysWithData}`,
      `Average Mood Rating: ${summary.averageMood.toFixed(2)}/5`
    ];

    summaryLines.forEach(line => {
      checkNewPage(7);
      pdf.text(line, margin + 5, yPosition);
      yPosition += 6;
    });

    // Mood Distribution
    checkNewPage(15);
    yPosition += 3;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mood Distribution:', margin + 5, yPosition);
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    
    Object.entries(summary.moodDistribution).forEach(([label, count]) => {
      checkNewPage(6);
      pdf.text(`  ${label}: ${count} entries (${((count / summary.totalEntries) * 100).toFixed(1)}%)`, margin + 10, yPosition);
      yPosition += 5;
    });

    yPosition += 5;

    // Raw Data Section
    checkNewPage(20);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Raw Data', margin, yPosition);
    yPosition += 8;

    // Table headers - only essential columns
    const colHeaders = ['Date', 'Time', 'Mood', 'Rating'];
    const colWidths = [45, 35, 50, 30];
    const availableWidth = pageWidth - (margin * 2);
    const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);
    const scale = (availableWidth - 10) / totalWidth;
    const normalizedWidths = colWidths.map(w => w * scale);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    let colStart = margin;
    colHeaders.forEach((header, idx) => {
      pdf.text(header, colStart + 2, yPosition);
      colStart += normalizedWidths[idx];
    });
    yPosition += 6;

    // Draw line under headers
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
    yPosition += 3;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    entries.forEach((entry) => {
      checkNewPage(8);
      
      // Add header if new page
      if (yPosition === margin + headerHeight) {
        drawHeader(pdf.internal.getCurrentPageInfo().pageNumber);
        yPosition = margin + headerHeight + 3;
      }
      
      colStart = margin;
      const rowData = [
        entry.date,
        formatTime(entry.timestamp),
        getMoodLabel(entry.mood),
        `${entry.mood}/5`
      ];

      rowData.forEach((cell, idx) => {
        const cellText = String(cell || '');
        const lines = pdf.splitTextToSize(cellText, normalizedWidths[idx] - 4);
        pdf.text(lines[0] || '', colStart + 2, yPosition);
        colStart += normalizedWidths[idx];
      });

      yPosition += 6;
    });

    // Add headers and footers to all pages
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      drawHeader(i);
      drawFooter(i, totalPages);
    }

    return pdf;
  } catch (error) {
    if (error.message === 'NO_DATA') {
      throw new Error('NO_DATA');
    }
    console.error('PDF export error:', error);
    throw new Error('PDF_GENERATION_ERROR');
  }
};

// Export to JSON - Only essential fields
export const exportMoodHistoryToJSON = async (startDate, endDate) => {
  try {
    const entries = await getMoodEntriesByDateRange(startDate, endDate);
    
    if (entries.length === 0) {
      throw new Error('NO_DATA');
    }

    const summary = calculateSummary(entries);
    
    // Export only essential fields
    const filteredEntries = entries.map(entry => ({
      date: entry.date,
      time: formatTime(entry.timestamp),
      moodRating: entry.mood,
      moodLabel: getMoodLabel(entry.mood)
    }));

    const exportData = {
      summary: {
        dateRange: summary.dateRange,
        totalEntries: summary.totalEntries,
        daysWithData: summary.daysWithData,
        averageMood: summary.averageMood,
        moodDistribution: summary.moodDistribution,
        exportDate: new Date().toISOString()
      },
      rawData: filteredEntries
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    if (error.message === 'NO_DATA') {
      throw new Error('NO_DATA');
    }
    console.error('JSON export error:', error);
    throw new Error('JSON_GENERATION_ERROR');
  }
};

// Save export metadata to IndexedDB (optional storage)
export const saveExportMetadata = async (filename, format, dateRange) => {
  try {
    // This is optional - we can store export history in IndexedDB
    const metadata = {
      filename,
      format,
      dateRange,
      exportedAt: new Date().toISOString()
    };
    console.log('Export metadata:', metadata);
    // Future: Store in IndexedDB exportHistory store
    return metadata;
  } catch (error) {
    console.error('Error saving export metadata:', error);
    // Don't throw - this is optional
  }
};

// Enhanced download file helper with better error handling
export const downloadFile = (content, filename, mimeType) => {
  try {
    // Check if browser supports Blob
    if (typeof Blob === 'undefined') {
      throw new Error('Browser does not support file downloads.');
    }

    const blob = new Blob([content], { type: mimeType });
    
    // Check blob size (safety check)
    if (blob.size === 0) {
      throw new Error('Generated file is empty.');
    }

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    return true;
  } catch (error) {
    console.error('Download error:', error);
    if (error.message.includes('storage') || error.message.includes('quota')) {
      throw new Error('STORAGE_ERROR');
    }
    throw new Error('DOWNLOAD_ERROR');
  }
};

// Main export function with comprehensive error handling
export const exportMoodHistory = async (startDate, endDate, format) => {
  try {
    // Validate inputs
    if (!startDate || !endDate) {
      throw new Error('MISSING_DATES');
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('INVALID_DATE_RANGE');
    }

    if (!format || !['CSV', 'PDF', 'JSON'].includes(format)) {
      throw new Error('INVALID_FORMAT');
    }

    const dateStr = `${startDate}_to_${endDate}`;
    let content;
    let filename;
    let mimeType;

    try {
      switch (format) {
        case 'CSV':
          content = await exportMoodHistoryToCSV(startDate, endDate);
          filename = `mood_history_${dateStr}.csv`;
          mimeType = 'text/csv;charset=utf-8;';
          downloadFile(content, filename, mimeType);
          break;

        case 'PDF':
          const pdf = await exportMoodHistoryToPDF(startDate, endDate);
          filename = `mood_history_${dateStr}.pdf`;
          pdf.save(filename);
          break;

        case 'JSON':
          content = await exportMoodHistoryToJSON(startDate, endDate);
          filename = `mood_history_${dateStr}.json`;
          mimeType = 'application/json';
          downloadFile(content, filename, mimeType);
          break;

        default:
          throw new Error('INVALID_FORMAT');
      }
    } catch (formatError) {
      // Re-throw format-specific errors
      throw formatError;
    }

    // Save export metadata (optional)
    await saveExportMetadata(filename, format, `${startDate} to ${endDate}`);

    return { success: true, filename };
  } catch (error) {
    console.error('Export error:', error);
    // Re-throw with specific error codes
    if (error.message === 'NO_DATA' || 
        error.message === 'MISSING_DATES' ||
        error.message === 'INVALID_DATE_RANGE' ||
        error.message === 'INVALID_FORMAT' ||
        error.message === 'CSV_GENERATION_ERROR' ||
        error.message === 'PDF_GENERATION_ERROR' ||
        error.message === 'JSON_GENERATION_ERROR' ||
        error.message === 'STORAGE_ERROR' ||
        error.message === 'DOWNLOAD_ERROR') {
      throw error;
    }
    throw new Error('UNKNOWN_ERROR');
  }
};
