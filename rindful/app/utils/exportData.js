// export journal entries with mood and energy data

import { getAllDataForExport, getStreakSummary } from "./db";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// clean null/undefined tasks from entries before export
const cleanEntries = (entries) => {
    return entries.map(entry => {
        const cleanedEntry = { ...entry };
        if (Array.isArray(cleanedEntry.tasks)) {
            cleanedEntry.tasks = cleanedEntry.tasks.filter(task =>
                task != null &&
                typeof task === 'object' &&
                task.id != null
            );
        }
        return cleanedEntry;
    });
};

// helper to get mood label
const getMoodLabel = (moodValue) => {
    const moodMap = { 1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Great' };
    return moodMap[moodValue] || 'N/A';
};

// helper to get energy label
const getEnergyLabel = (energyValue) => {
    const energyMap = { 1: 'Exhausted', 2: 'Tired', 3: 'Okay', 4: 'Energetic', 5: 'Very Energetic' };
    return energyMap[energyValue] || 'N/A';
};

// export to CSV with mood, energy, and tasks
export const exportToCSV = (entries) => {
    // cleaned entries before export
    const cleanedEntries = cleanEntries(entries);

    // CSV headers - expanded to include tasks
    const headers = ['Date', 'Mood', 'Energy', 'Word Count', 'Tasks Completed', 'Tasks Total', 'Content', 'Tasks'];

    // convert data entries to CSV rows
    const rows = cleanedEntries.map(entry => {
        // remove HTML tags and escape quotes in content
        const cleanContent = (entry.content || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/"/g, '""')
            .trim();
        
        const validTasks = (entry.tasks || []).filter(t => t != null);
        const completedTasks = validTasks.filter(t => t.completed).length;
        const tasksList = validTasks.map(t => t.text || 'Untitled').join('; ');

        return [
            entry.date,
            getMoodLabel(entry.mood),
            getEnergyLabel(entry.energy),
            entry.wordCount || 0,
            completedTasks,
            validTasks.length,
            `"${cleanContent}"`, // wrap in quotes for CSV
            `"${tasksList}"` // tasks list
        ];
    });
    
    // combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    return csvContent;
};

// download CSV file
export const downloadCSV = async (filename = 'journal_entries.csv') => {
    try {
        const entries = await getAllDataForExport();
        const csvContent = exportToCSV(entries);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    catch (error) {
        console.error('Export Failed:', error);
        throw error;
    }
};

// export to JSON
export const exportToJSON = (entries) => {
    const cleanedEntries = cleanEntries(entries);
    return JSON.stringify(cleanedEntries, null, 2);
}

// download JSON file
export const downloadJSON = async (filename = 'journal_entries.json') => {
    try {
        const entries = await getAllDataForExport();
        const jsonContent = exportToJSON(entries);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');

        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Export failed: ', error);
        throw error;
    }
};

// export to PDF with charts and data - Modern wellness app design
export const exportToPDF = async (chartElement = null, filename = 'rindful_report.pdf') => {
    try {
        const entries = await getAllDataForExport();
        const streakSummary = await getStreakSummary();
        const cleanedEntries = cleanEntries(entries);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 12; // Minimal safe margins for single-page optimization
        const headerHeight = 18; // Compact header
        const footerHeight = 8;
        const cardPadding = 2.5; // Very compact padding inside cards
        const cardSpacing = 2.5; // Minimal space between cards
        let yPosition = margin + headerHeight;

        // Color palette
        const colors = {
            primary: [249, 115, 22], // Orange
            text: [30, 30, 30], // Dark gray
            textLight: [100, 100, 100], // Light gray
            textSubtle: [150, 150, 150], // Very light gray
            cardBg: [248, 248, 248], // Very light gray background
            divider: [230, 230, 230], // Light divider
            accent: [249, 115, 22] // Orange accent
        };

        // Helper function to add a new page if needed
        const checkNewPage = (requiredHeight) => {
            if (yPosition + requiredHeight > pageHeight - footerHeight) {
                pdf.addPage();
                yPosition = margin + headerHeight;
                drawHeader();
                return true;
            }
            return false;
        };

        // Draw card with background (rounded corners simulated with regular rect)
        const drawCard = (x, y, width, height) => {
            // Light gray background
            pdf.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
            pdf.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
            pdf.setLineWidth(0.3);
            
            // Draw rectangle with fill and stroke (FD = Fill and Draw)
            // Note: jsPDF doesn't have native roundedRect, using regular rect for clean look
            pdf.rect(x, y, width, height, 'FD');
        };

        // Draw section title (plain text only, no icons)
        const drawSectionTitle = (title) => {
            checkNewPage(12);
            pdf.setFontSize(12); // Compact
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            pdf.text(title, margin, yPosition);
            yPosition += 4; // Minimal spacing
        };

        // Draw modern header bar on each page
        const drawHeader = () => {
            // Header bar background
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, headerHeight, 'F');
            
            // RINDFUL logo text (left)
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            pdf.text('RINDFUL', margin, 8);
            
            // Subtle divider line under header
            pdf.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
            pdf.setLineWidth(0.3);
            pdf.line(0, headerHeight - 1, pageWidth, headerHeight - 1);
        };

        // Draw subtle footer on each page
        const drawFooter = (pageNum, totalPages) => {
            pdf.setFontSize(6);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(colors.textSubtle[0], colors.textSubtle[1], colors.textSubtle[2]);
            pdf.text(
                `Page ${pageNum} of ${totalPages}  |  Generated by RINDFUL`,
                pageWidth / 2,
                pageHeight - 4,
                { align: 'center' }
            );
        };

        // Draw header on first page
        drawHeader();

        // Cover Title Section
        pdf.setFontSize(18); // Compact title
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        pdf.text('RINDFUL Wellness Report', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 4; // Minimal spacing

        // Date range below title
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        const dates = cleanedEntries.map(e => e.date).sort();
        const dateRange = dates.length > 0 
            ? `${dates[0]} to ${dates[dates.length - 1]}`
            : 'No data available';
        pdf.text(dateRange, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 3; // Minimal spacing

        // Subtle divider line
        pdf.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
        pdf.setLineWidth(0.3);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 4; // Minimal spacing

        // Calculate statistics
        const totalEntries = cleanedEntries.length;
        const totalWords = cleanedEntries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
        const totalTasks = cleanedEntries.reduce((sum, e) => {
            const tasks = (e.tasks || []).filter(t => t != null);
            return sum + tasks.length;
        }, 0);
        const completedTasks = cleanedEntries.reduce((sum, e) => {
            const tasks = (e.tasks || []).filter(t => t != null && t.completed);
            return sum + tasks.length;
        }, 0);
        
        const avgMood = cleanedEntries
            .filter(e => e.mood != null && e.mood > 0)
            .reduce((sum, e) => sum + e.mood, 0) / 
            Math.max(cleanedEntries.filter(e => e.mood != null && e.mood > 0).length, 1);
        
        const avgEnergy = cleanedEntries
            .filter(e => e.energy != null && e.energy > 0)
            .reduce((sum, e) => sum + e.energy, 0) / 
            Math.max(cleanedEntries.filter(e => e.energy != null && e.energy > 0).length, 1);

        // Summary Statistics Section - Card with Two Column Layout
        const summaryCardHeight = 40; // Very compact
        checkNewPage(summaryCardHeight + 10);
        
        drawSectionTitle('Summary Statistics');
        yPosition += 0.5; // Minimal spacing

        // Draw summary card
        const cardX = margin;
        const cardY = yPosition;
        const cardWidth = pageWidth - (margin * 2);
        drawCard(cardX, cardY, cardWidth, summaryCardHeight);
        
        // Content inside card
        const contentX = cardX + cardPadding;
        const contentY = cardY + cardPadding + 2;
        let contentYPos = contentY;
        
        pdf.setFontSize(8.5); // Smaller font
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        
        const col1X = contentX;
        const col2X = pageWidth / 2 + 3; // Tighter column spacing
        const lineHeight = 4.5; // Very tight spacing

        // Left column (Journal & Tasks)
        pdf.text(`Total Journal Entries: ${totalEntries}`, col1X, contentYPos);
        contentYPos += lineHeight;
        pdf.text(`Total Words Written: ${totalWords.toLocaleString()}`, col1X, contentYPos);
        contentYPos += lineHeight;
        pdf.text(`Total Tasks: ${totalTasks}`, col1X, contentYPos);
        contentYPos += lineHeight;
        pdf.text(`Completed Tasks: ${completedTasks}`, col1X, contentYPos);

        // Right column (Mood, Energy, Streaks)
        contentYPos = contentY;
        pdf.text(`Average Mood: ${avgMood.toFixed(1)}/5`, col2X, contentYPos);
        contentYPos += lineHeight;
        pdf.text(`Average Energy: ${avgEnergy.toFixed(1)}/5`, col2X, contentYPos);
        contentYPos += lineHeight;
        pdf.text(`Current Streak: ${streakSummary.currentStreak} days`, col2X, contentYPos);
        contentYPos += lineHeight;
        pdf.text(`Longest Streak: ${streakSummary.longestStreak} days`, col2X, contentYPos);
        contentYPos += lineHeight;
        pdf.text(`Days Checked In: ${streakSummary.totalDaysChecked}`, col2X, contentYPos);

        yPosition = cardY + summaryCardHeight + cardSpacing;

        // Add chart if provided
        if (chartElement) {
            checkNewPage(70);
            try {
                drawSectionTitle('7-Day Trends');
                yPosition += 1; // Reduced from 3
                
                const canvas = await html2canvas(chartElement, {
                    backgroundColor: '#ffffff',
                    scale: 3,
                    logging: false,
                    useCORS: true
                });
                
                const imgData = canvas.toDataURL('image/png', 1.0);
                const imgWidth = pageWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                checkNewPage(imgHeight + 10);
                
                // Draw chart in a card
                const chartCardY = yPosition;
                drawCard(margin, chartCardY, imgWidth, imgHeight + 6);
                pdf.addImage(imgData, 'PNG', margin + 3.5, chartCardY + 3.5, imgWidth - 7, imgHeight);
                yPosition = chartCardY + imgHeight + 6 + cardSpacing; // Removed extra +10
            } catch (error) {
                console.error('Error adding chart to PDF:', error);
                pdf.setFontSize(9);
                pdf.setTextColor(colors.textSubtle[0], colors.textSubtle[1], colors.textSubtle[2]);
                pdf.text('Chart could not be included in PDF', margin, yPosition);
                yPosition += 10;
            }
        }

        // Journal Entries Section - Each entry in its own card
        drawSectionTitle('Journal Entries');
        yPosition += 1; // Minimal spacing

        cleanedEntries.forEach((entry, index) => {
            // Estimate card height (will adjust dynamically)
            const estimatedCardHeight = 30;
            checkNewPage(estimatedCardHeight + cardSpacing);
            
            // Calculate actual content height
            let contentHeight = 0;
            const tempY = yPosition;
            
            // Date
            contentHeight += 4.5; // Compact
            // Mood, Energy, Tasks
            if (entry.mood) contentHeight += 3.5; // Very compact
            if (entry.energy) contentHeight += 3.5; // Very compact
            const validTasks = (entry.tasks || []).filter(t => t != null);
            if (validTasks.length > 0) contentHeight += 3.5; // Very compact
            // Content
            if (entry.content) {
                const cleanContent = entry.content.replace(/<[^>]*>/g, ' ').trim();
                if (cleanContent) {
                    contentHeight += 3.5; // "Journal Entry:" label
                    const contentLines = pdf.splitTextToSize(cleanContent, pageWidth - (margin * 2) - (cardPadding * 2) - 4);
                    contentHeight += contentLines.length * 3.2; // Very compact line height
                }
            }
            
            const cardHeight = contentHeight + (cardPadding * 2) + 2; // Minimal extra space
            
            // Check if card fits on current page
            if (yPosition + cardHeight > pageHeight - footerHeight) {
                pdf.addPage();
                yPosition = margin + headerHeight;
                drawHeader();
            }
            
            // Draw entry card
            const entryCardX = margin;
            const entryCardY = yPosition;
            const entryCardWidth = pageWidth - (margin * 2);
            drawCard(entryCardX, entryCardY, entryCardWidth, cardHeight);
            
            // Content inside card
            let cardContentY = entryCardY + cardPadding + 2;
            const cardContentX = entryCardX + cardPadding;
            
            // Date as bold title
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9.5); // Compact but readable
            pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            pdf.text(entry.date, cardContentX, cardContentY);
            cardContentY += 4.5; // Compact spacing
            
            // Mood, Energy, Tasks in clean aligned list
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8); // Smaller body text
            pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            
            if (entry.mood) {
                pdf.text(`Mood: ${getMoodLabel(entry.mood)} (${entry.mood}/5)`, cardContentX, cardContentY);
                cardContentY += 3.5; // Very compact
            }
            
            if (entry.energy) {
                pdf.text(`Energy: ${getEnergyLabel(entry.energy)} (${entry.energy}/5)`, cardContentX, cardContentY);
                cardContentY += 3.5; // Very compact
            }

            if (validTasks.length > 0) {
                const completed = validTasks.filter(t => t.completed).length;
                pdf.text(`Tasks Completed: ${completed}/${validTasks.length}`, cardContentX, cardContentY);
                cardContentY += 3.5; // Very compact
            }

            // Journal content
            if (entry.content) {
                const cleanContent = entry.content.replace(/<[^>]*>/g, ' ').trim();
                if (cleanContent) {
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(8);
                    pdf.text('Journal Entry:', cardContentX, cardContentY);
                    cardContentY += 3.5; // Compact
                    
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                    
                    const contentLines = pdf.splitTextToSize(cleanContent, pageWidth - (margin * 2) - (cardPadding * 2) - 4);
                    contentLines.forEach(line => {
                        pdf.text(line, cardContentX, cardContentY);
                        cardContentY += 3.2; // Very compact line height
                    });
                }
            }

            yPosition = entryCardY + cardHeight + cardSpacing;
            
            // Visual separator between entries (subtle line) - removed extra spacing
            // No additional spacing between entries
        });

        // Add headers and footers to all pages
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            if (i === 1) {
                // First page already has header drawn
            } else {
                drawHeader();
            }
            drawFooter(i, totalPages);
        }

        // Save PDF
        pdf.save(filename);
        return pdf;
    } catch (error) {
        console.error('PDF export failed:', error);
        throw error;
    }
};

// download PDF file
export const downloadPDF = async (chartElement = null, filename = 'rindful_report.pdf') => {
    try {
        await exportToPDF(chartElement, filename);
    } catch (error) {
        console.error('PDF download failed:', error);
        throw error;
    }
};