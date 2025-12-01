// export journal entries with mood and energy data

import { getAllDataForExport } from "./db";

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

// export to CSV with mood and energy
export const exportToCSV = (entries) => {

    // cleaned entries before export
    const cleanedEntries = cleanEntries(entries);

    // CSV headers
    const headers = ['Date', 'Mood', 'Energy', 'Word Count', 'Content'];

    // convert data entries to CSV rows
    const rows = cleanedEntries.map(entry => {

        // remove HTML tags and escape quotes in content
        const cleanContent = entry.content
            .replace(/<[^>]*>/g, ' ')
            .replace(/"/g, '""')
            .trim();
        return [
            entry.date,
            entry.mood || 'N/A',
            entry.energy || 'N/A',
            entry.wordCount,
            `"${cleanContent}"` // wrap in quotes for CSV
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