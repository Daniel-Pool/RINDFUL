// indexedDB wrapper for local-only journal entries

const DB_NAME = 'RindfulJournalDB';
const DB_VERSION = 1;
const STORE_NAME = 'dailyEntries';

let dbPromise = null;

// initialize database (singleton pattern)
export const initDB = () => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    // check if IndexedDB is available
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      dbPromise = null; // Reset on error so it can be retried
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      console.log('IndexedDB opened successfully');
      
      // verify the object store exists
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.error('Object store not found, closing and resetting');
        db.close();
        dbPromise = null;
        // force upgrade by reopening with higher version
        const upgradeRequest = indexedDB.open(DB_NAME, DB_VERSION + 1);
        upgradeRequest.onupgradeneeded = (event) => {
          const upgradedDb = event.target.result;
          if (!upgradedDb.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = upgradedDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
            objectStore.createIndex('userId', 'userId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
        upgradeRequest.onerror = () => reject(upgradeRequest.error);
        return;
      }
      
      // handle database closure
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      console.log('IndexedDB upgrade needed, current version:', event.oldVersion);
      const db = event.target.result;
      
      // create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log('Creating object store:', STORE_NAME);
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // create indexes for efficient querying
        objectStore.createIndex('userId', 'userId', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        
        console.log('Object store created successfully');
      }
    };

    request.onblocked = () => {
      console.warn('IndexedDB blocked - please close other tabs with this app');
      alert('Please close other tabs with this app open and refresh');
    };
  });

  return dbPromise;
};

// get current user ID
const getCurrentUserId = () => {
  if (typeof window === 'undefined') return 'local_user';
  
  try {
    const { getAuth } = require('firebase/auth');
    const { app } = require('../firebase');
    const auth = getAuth(app);
    return auth.currentUser?.uid || 'local_user';
  } catch (error) {
    console.log('Firebase auth not available, using local_user');
    return 'local_user';
  }
};

// create document ID
const getDailyEntryId = (userId, date) => {
  return `${userId}_${date}`;
};

// helper to ensure DB is ready
const ensureDB = async () => {
  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      throw new Error('Database not properly initialized');
    }
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// save or update a complete daily entry
export const saveDailyEntry = async (entryData) => {
  const db = await ensureDB();
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
      
      // merge new data with existing
      const dailyEntry = {
        id: docId,
        userId: userId,
        date: date,
        content: entryData.content !== undefined ? entryData.content : existing.content || '',
        mood: entryData.mood !== undefined ? entryData.mood : existing.mood || null,
        energy: entryData.energy !== undefined ? entryData.energy : existing.energy || null,
        wordCount: entryData.wordCount !== undefined ? entryData.wordCount : existing.wordCount || 0,
        timestamp: new Date().getTime(),
        tasks: entryData.tasks !== undefined ? entryData.tasks : existing.tasks || [],
      };
      
      const putRequest = store.put(dailyEntry);
      putRequest.onsuccess = () => {
        console.log('Entry saved successfully:', dailyEntry);
        resolve(dailyEntry);
      };
      putRequest.onerror = () => {
        console.error('Put request error:', putRequest.error);
        reject(putRequest.error);
      };
    };
    
    getRequest.onerror = () => {
      console.error('Get request error:', getRequest.error);
      reject(getRequest.error);
    };

    transaction.onerror = () => {
      console.error('Transaction error:', transaction.error);
      reject(transaction.error);
    };
  });
};

// update just the journal content
export const updateJournalContent = async (date, content, wordCount) => {
  return await saveDailyEntry({
    date: date,
    content: content,
    wordCount: wordCount
  });
};

// update just the mood
export const updateMood = async (date, moodValue) => {
  return await saveDailyEntry({
    date: date,
    mood: moodValue
  });
};

// update just the energy
export const updateEnergy = async (date, energyValue) => {
  return await saveDailyEntry({
    date: date,
    energy: energyValue
  });
};

export const updatePlannerTasks = async (date, tasks) => {
  // merge into daily entry for given date
  return await saveDailyEntry({ date, tasks });
};

export const getPlannerTasksByDate = async (date) => {
  const entry = await getDailyEntry(date);
  return entry?.tasks || [];
};

// get entry for a specific date
export const getDailyEntry = async (date) => {
  try {
    const db = await ensureDB();
    const userId = getCurrentUserId();
    const docId = getDailyEntryId(userId, date);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(docId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        console.error('Get request error:', request.error);
        reject(request.error);
      };

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('getDailyEntry error:', error);
    return null;
  }
};

// get all entries for current user
export const getAllEntries = async () => {
  try {
    const db = await ensureDB();
    const userId = getCurrentUserId();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const entries = request.result.sort((a, b) => 
          b.date.localeCompare(a.date)
        );
        resolve(entries);
      };
      
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('getAllEntries error:', error);
    return [];
  }
};

// get entries within a date range
export const getEntriesByDateRange = async (startDate, endDate) => {
  try {
    const db = await ensureDB();
    const userId = getCurrentUserId();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('date');
      
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => {
        const entries = request.result
          .filter(entry => entry.userId === userId)
          .sort((a, b) => b.date.localeCompare(a.date));
        resolve(entries);
      };
      
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('getEntriesByDateRange error:', error);
    return [];
  }
};

// delete an entry
export const deleteEntry = async (date) => {
  const db = await ensureDB();
  const userId = getCurrentUserId();
  const docId = getDailyEntryId(userId, date);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(docId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

// get all entries for export
export const getAllDataForExport = async () => {
  return await getAllEntries();
};