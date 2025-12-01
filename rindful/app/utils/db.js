// indexedDB wrapper for local-only journal entries

const DB_NAME = 'RindfulJournalDB';
const DB_VERSION = 2;
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

      // create object store for streak tracking
      if (!db.objectStoreNames.contains('userStats')) {
        console.log('Creating userStats store');
        db.createObjectStore('userStats', { keyPath: 'userId' });
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
      };
      
      const putRequest = store.put(dailyEntry);
      putRequest.onsuccess = () => {
        console.log('Entry saved successfully:', dailyEntry);
        // fix circular referencing
        setTimeout(() => {
          import('./db')
            .then(mod => {
              if (mod && typeof mod.updateStreakForDate === 'function') {
                mod.updateStreakForDate(date).catch(err => console.error('updateStreakForDate err', err));
              }
            })
            .catch(err => {
              // dynamic import of same module can fail sometimes but ignore quietly for now
              console.debug('streak update dynamic import failed', err);
            });
        }, 0);

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

// user stats/streaks (weekly citrus/orange)
// week splitting helper (0 = sunday)
const sundayOf = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split("T")[0];
};

// userStats transaction helper
const getStatsStore = async () => {
  const db = await ensureDB();
  const tx = db.transaction(['userStats'], 'readwrite');
  return tx.objectStore('userStats');
};

// read user stats
export const getUserStats = async () => {
  const userId = getCurrentUserId();
  const store = await getStatsStore();

  return new Promise((resolve) => {
    const req = store.get(userId);
    req.onsuccess = () => {
      const r = req.result;
      if (r) return resolve(r);

      // default structure
      resolve({
        userId,
        // uses YYYY-MM-DD format
        lastCheckInDate: null,
        // consecutive days ending @ lastCheckInDate
        currentStreak: 0,
        longestStreak: 0,
        // current week data
        weekStart: null,
        weeklyDays: [false, false, false, false, false, false, false],
      });
    };
    req.onerror = () => resolve(null);
  });
};

// write user stats
export const saveUserStats = async (stats) => {
  const store = await getStatsStore();
  return new Promise((resolve, reject) => {
    const req = store.put(stats);
    req.onsuccess = () => resolve(stats);
    req.onerror = () => reject(req.error);
  });
};

// update streak
export const updateStreakForDate = async (date) => {
  const stats = await getUserStats();
  if (!stats) return null;

  const today = date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // record current dsy
  if (stats.lastCheckInDate === today) {
  } else {
    if (stats.lastCheckInDate === yesterday) {
      // consecutive day increment
      stats.currentStreak = (stats.currentStreak || 0) + 1;
    } else {
      // missed streak day -> reset streak to 1
      stats.currentStreak = 1;
    }

    // update most recent check in date & longest streak
    stats.lastCheckInDate = today;
    stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);
  }

  // weekly slices
  const weekStart = sundayOf(today);

  if (stats.weekStart !== weekStart) {
    // new week
    const newWeekly = [false, false, false, false, false, false, false];
    const idx = new Date(today + 'T00:00:00').getDay(); // 0..6
    newWeekly[idx] = true;
    stats.weekStart = weekStart;
    stats.weeklyDays = newWeekly;
  } else {
    // get what day of the week it is
    const idx = new Date(today + 'T00:00:00').getDay();
    stats.weeklyDays = stats.weeklyDays || [false, false, false, false, false, false, false];
    stats.weeklyDays[idx] = true;
  }

  await saveUserStats(stats);
  return stats;
};

// streak summary
// to help implement specific streak info into stats/analytics page when that's settled
export const getStreakSummary = async () => {
  // grab all entries for current user
  const all = await getAllEntries();
  const map = {};

  // make sure it's only days that have user activity (aka journal, mood, energy)
  all.forEach((c) => {
    const hasCheck = !!(c.content || c.mood !== null && c.mood !== undefined || c.energy !== null && c.energy !== undefined);
    if (!hasCheck) return;
    map[c.date] = c;
  });

  // helper for seeing if a day can count for the streak
  const hasCheckin = (dateStr) => !!map[dateStr];

  // totals by type
  const totalJournalDays = all.filter((c) => c.content && c.content.trim() !== '').length;
  const totalMoodDays = all.filter((c) => c.mood !== null && c.mood !== undefined).length;
  const totalEnergyDays = all.filter((c) => c.energy !== null && c.energy !== undefined).length;
  const totalDaysChecked = Object.keys(map).length;

  // current streak
  let currentStreak = 0;
  const today = new Date();
  let d = new Date(today);

  for (;;) {
    const ds = d.toISOString().split('T')[0];
    if (hasCheckin(ds)) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // get longest streak
  const datesAsc = Object.keys(map).sort();
  let longestStreak = 0;
  let run = 0;
  let prev = null;

  for (const dateStr of datesAsc) {
    if (!prev) {
      run = 1;
    } else {
      const prevD = new Date(prev + 'T00:00:00');
      const curD = new Date(dateStr + 'T00:00:00');
      const diff = Math.round((curD - prevD) / (1000 * 60 * 60 * 24));
      if (diff === 1) run++;
      else run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prev = dateStr;
  }

  // calculate total "weekly citrus/oranges"/ weeks with a complete weekly streak
  const weeks = {};
  for (const dEntry of Object.values(map)) {
    const wk = sundayOf(dEntry.date);
    if (!weeks[wk]) weeks[wk] = new Set();
    weeks[wk].add(dEntry.date);
  }

  let completedFullWeeks = 0;
  for (const wk in weeks) {
    if (weeks[wk].size >= 7) completedFullWeeks++;
  }

  // current week info
  const currentWeekStart = sundayOf(today.toISOString().split('T')[0]);
  const currentWeekCount = (weeks[currentWeekStart] && weeks[currentWeekStart].size) || 0;

  return {
    currentStreak,
    longestStreak,
    totalDaysChecked,
    totalJournalDays,
    totalMoodDays,
    totalEnergyDays,
    currentWeekCount,
    currentWeekStart,
    completedFullWeeks,
    checkinsByDate: map,
  };
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

// helper for if a date has data
export const hasEntryForDate = async (date) => {
  const entry = await getDailyEntry(date);
  return entry !== null;
};

// get all entries for export
export const getAllDataForExport = async () => {
  return await getAllEntries();
};