// import journal entries from CSV or JSON files

import { saveDailyEntry } from "./db";

// parse CSV content
export const parseCSV = (csvContent) => {

    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('CSV File is empty or invalid');
    }

    // parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // validate required headers
    const requiredHeaders = ['date', 'content'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        throw new Error (`Missing required headers:', ${missingHeaders.join(', ')}`);
    }

    const entries = [];

    // parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;


        const values = [];
        let currentValue = '';
        let insideQuotes = false;

        // handle quoted fields (CSV standard)
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = line[j + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    // escaped quote
                    currentValue += '"';
                    j++; // skip next quote
                } else {
                    // toggle quote state
                    insideQuotes = !insideQuotes;
                } 
            } else if (char === ',' && !insideQuotes) {
                // end of field
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        // add last value
        values.push(currentValue.trim());

        // map values to entry object
        const entry = {};
        headers.forEach((header, index) => {
            const value = values[index] || '';
            switch(header) {
                case 'date':
                    entry.date = value;
                    break;
                case 'mood':
                    entry.mood = value;
                    break;
                case 'energy':
                    entry.energy = value;
                    break;
                case 'word count':
                case 'wordcount':
                    entry.wordCount = parseInt(value) || 0;
                    break;
                case 'content':
                    entry.content = value;
                    break;
                default:
                    entry[header] = value;
            }
        });

        // validate date format (YYYY-MM-DD)
        if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
            console.warn(`Skipping row ${i + 1}: invalid date format "${entry.date}"`);
            continue;
        }
        entries.push(entry);
    };
    return entries;
};

// parse JSON content
export const parseJSON = (jsonContent) => {
    let data;
    try {
        data = JSON.parse(jsonContent);
    } catch (error) {
        throw new Error ('Invaid JSON Format');
    }

    // ensure data's in an array
    if (!Array.isArray(data)) {
        throw new Error('JSON must contain an array of entries');
    }

    const entries = [];
    for (let i = 0; i < data.length; i++) {
        const item = data[i];

        // validate required fields
        if (!item.date) {
            console.warn(`Skipping entry ${i+1}: missing date field`);
        }

        // validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
            console.warn(`Skipping entry ${i + 1}: invalid date format "${item.date}"`);
            continue;
        }

        // normalize entry structure
        const entry = {
            date: item.date,
            content: item.content || '',
            mood: item.mood || null,
            energy: item.energy || null,
            wordCount: parseInt(item.wordCount) || 0,
            tasks: Array.isArray(item.tasks) ? item.tasks : []
        };
        entries.push(entry);
    }
    return entries;
};

// import entries into database
export const importEntries = async (entries, options = {}) => {
    const {
        overwrite = false,
        onProgress = null
    } = options;

    const results = {
        total: entries.length,
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: []
    };

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        
        try {
            // check if entry exists (if not overwriting)
            if (!overwrite) {
                const { getDailyEntry } = await import('./db');
                const existing = await getDailyEntry(entry.date);
                
                if (existing && existing.content) {
                    console.log(`Skipping ${entry.date}: entry already exists`);
                    results.skipped++;
                    if (onProgress) onProgress(i + 1, results.total, 'skipped');
                    continue;
                }
            }

            // save entry
            await saveDailyEntry(entry);
            results.imported++;
            if (onProgress) onProgress(i + 1, results.total, 'success');

        } catch (error) {
            console.error(`Failed to import entry for ${entry.date}:`, error);
            results.failed++;
            results.errors.push({
                date: entry.date,
                error: error.message
            });
            if (onProgress) onProgress(i + 1, results.total, 'failed');
        }
    }

    return results;
};

// handle file upload and import
export const importFromFile = async (file, options = {}) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                const fileName = file.name.toLowerCase();

                let entries;

                // determine file type, parse if valid
                if (fileName.endsWith('.csv')) {
                    entries = parseCSV(content);
                } else if (fileName.endsWith('.json')) {
                    entries = parseJSON(content);
                } else {
                    throw new Error('Unsupported file format: please use CSV or JSON.');
                }

                if (entries.length === 0) {
                    throw new Error('No valid entries found in file')
                }
                
                // import entries
                const results = await importEntries(entries, options);
                resolve(results);

            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
};

// validate import file before importing
export const validateImportFile =  async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const fileName = file.name.toLowerCase();

                let entries;

                if (fileName.endsWith('.csv')) {
                    entries = parseCSV(content);
                } else if (fileName.endsWith('.json')) {
                    entries = parseJSON(content);
                } else {
                    reject(new Error('Unsupported file format'));
                    return;
                }

                resolve({
                    valid: true,
                    entryCount: entries.length,
                    dateRange: entries.length > 0 ? {
                        earliest: entries.reduce((min, e) => e.date < min ? e.date : min, entries[0].date),
                        latest: entries.reduce((max, e) => e.date > max ? e.date : max, entries[0].date)
                    } : null
                });
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
};