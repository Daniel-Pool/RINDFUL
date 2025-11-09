// indexedDB wrapper for local-only journal entries

const DB_NAME = 'RindfulJournalDB';
const DB_VERSION = 1;
const STORE_NAME = 'dailyEntries';

// initialize database
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // create indexes for efficient querying
        objectStore.createIndex('userId', 'userId', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// get current user ID
const getCurrentUserId = () => {
  // use firebase auth for user identity
  const auth = require('../firebase').auth;
  return auth.currentUser?.uid || 'local_user';
};

// create document ID
const getDailyEntryId = (userId, date) => {
  return `${userId}_${date}`;
};

// save or update a complete daily entry
export const saveDailyEntry = async (entryData) => {
  const db = await initDB();
  const userId = getCurrentUserId();
  const date = entryData.date || new Date().toISOString().split('T')[0];
  const docId = getDailyEntryId(userId, date);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // get existing entry to merge with
    const getRequest = store.get(docId);
    
    getRequest.onsuccess = () => {
      const existing = getRequest.result || {};
      
      // merge new data with existing data
      const dailyEntry = {
        id: docId,
        userId: userId,
        date: date,
        content: entryData.content !== undefined ? entryData.content : existing.content || '',
        mood: entryData.mood !== undefined ? entryData.mood : existing.mood || null,
        energy: entryData.energy !== undefined ? entryData.energy : existing.energy || null,
        wordCount: entryData.wordCount !== undefined ? entryData.wordCount : existing.wordCount || 0,
        timestamp: new Date().getTime(),
      };
      
      const putRequest = store.put(dailyEntry);
      putRequest.onsuccess = () => resolve(dailyEntry);
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// update the journal content
export const updateJournalContent = async (date, content, wordCount) => {
  const userId = getCurrentUserId();
  
  return await saveDailyEntry({
    date: date,
    content: content,
    wordCount: wordCount
  });
};

// update the mood
export const updateMood = async (date, moodValue) => {
  return await saveDailyEntry({
    date: date,
    mood: moodValue
  });
};

// update the energy
export const updateEnergy = async (date, energyValue) => {
  return await saveDailyEntry({
    date: date,
    energy: energyValue
  });
};

// get entry for a specific date
export const getDailyEntry = async (date) => {
  const db = await initDB();
  const userId = getCurrentUserId();
  const docId = getDailyEntryId(userId, date);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(docId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// get all entries for current user
export const getAllEntries = async () => {
  const db = await initDB();
  const userId = getCurrentUserId();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => {
      // sort by date descending
      const entries = request.result.sort((a, b) => 
        b.date.localeCompare(a.date)
      );
      resolve(entries);
    };
    request.onerror = () => reject(request.error);
  });
};

// get entries within a date range
export const getEntriesByDateRange = async (startDate, endDate) => {
  const db = await initDB();
  const userId = getCurrentUserId();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('date');
    
    const range = IDBKeyRange.bound(startDate, endDate);
    const request = index.getAll(range);

    request.onsuccess = () => {
      // filter by userId and sort
      const entries = request.result
        .filter(entry => entry.userId === userId)
        .sort((a, b) => b.date.localeCompare(a.date));
      resolve(entries);
    };
    request.onerror = () => reject(request.error);
  });
};

// delete an entry
export const deleteEntry = async (date) => {
  const db = await initDB();
  const userId = getCurrentUserId();
  const docId = getDailyEntryId(userId, date);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(docId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// get all entries for export
export const getAllDataForExport = async () => {
  return await getAllEntries();
};