import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BuJoEntry, BuJoCollection, PageScan, CustomSignifier, QuarterlyPlan } from '../types/BuJo';

interface BuJoState {
  // Data
  entries: BuJoEntry[];
  collections: BuJoCollection[];
  scans: PageScan[];
  customSignifiers: CustomSignifier[];
  quarterlyPlans: QuarterlyPlan[];
  
  // Current state
  currentDate: string; // YYYY-MM-DD
  selectedCollection: BuJoCollection | null;
  
  // Navigation
  setCurrentDate: (date: string) => void;
  
  // Actions
  addEntry: (entry: Omit<BuJoEntry, 'id' | 'createdAt'>) => BuJoEntry;
  addEntries: (entries: Omit<BuJoEntry, 'id' | 'createdAt'>[]) => BuJoEntry[];
  updateEntry: (id: string, updates: Partial<BuJoEntry>) => void;
  deleteEntry: (id: string) => void;
  
  addCollection: (collection: Omit<BuJoCollection, 'id' | 'createdAt' | 'modifiedAt'>) => void;
  updateCollection: (id: string, updates: Partial<BuJoCollection>) => void;
  
  addScan: (scan: Omit<PageScan, 'id' | 'processedAt'>) => void;
  
  // Collection management
  getDailyLog: (date: string) => BuJoCollection | null;
  getMonthlyLog: (yearMonth: string) => BuJoCollection | null;
  getFutureLog: () => BuJoCollection | null;
  
  // Entry queries
  getEntriesByCollection: (collectionId: string) => BuJoEntry[];
  getEntriesByType: (type: BuJoEntry['type']) => BuJoEntry[];
  getIncompleteEntries: () => BuJoEntry[];
  
  // Custom Collections
  getCustomCollections: () => BuJoCollection[];
  addCustomCollection: (collection: Omit<BuJoCollection, 'id' | 'type' | 'createdAt' | 'modifiedAt' | 'entries'>) => void;
  deleteCustomCollection: (id: string) => void;
  assignEntriesToCollection: (collectionId: string, entryIds: string[]) => void;
  
  // Custom Signifiers
  addCustomSignifier: (signifier: Omit<CustomSignifier, 'id' | 'createdAt' | 'modifiedAt'>) => void;
  updateCustomSignifier: (id: string, updates: Partial<CustomSignifier>) => void;
  deleteCustomSignifier: (id: string) => void;
  getCustomSignifier: (id: string) => CustomSignifier | undefined;
  
  // Quarterly Planning
  addQuarterlyPlan: (plan: Omit<QuarterlyPlan, 'id' | 'createdAt' | 'modifiedAt'>) => void;
  updateQuarterlyPlan: (id: string, updates: Partial<QuarterlyPlan>) => void;
  getQuarterlyPlan: (quarter: string, year: number) => QuarterlyPlan | undefined;
  
  // Migration
  migrateEntries: (fromDate: string, toDate: string, entryIds: string[]) => void;
  
  // Persistence
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearStorage: () => Promise<void>;
  
  // Initialization
  initialize: () => Promise<void>;
}

// Storage keys
const STORAGE_KEYS = {
  ENTRIES: 'bujo_entries',
  COLLECTIONS: 'bujo_collections',
  SCANS: 'bujo_scans',
  CUSTOM_SIGNIFIERS: 'bujo_custom_signifiers',
  QUARTERLY_PLANS: 'bujo_quarterly_plans',
  METADATA: 'bujo_metadata'
};

const generateId = () => Math.random().toString(36).substring(2, 15);

const formatDate = (date: Date) => date.toISOString().split('T')[0];

// Storage helpers
const saveToAsyncStorage = async (key: string, data: any): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonData);
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
    throw error;
  }
};

const loadFromAsyncStorage = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const jsonData = await AsyncStorage.getItem(key);
    if (jsonData === null) return defaultValue;
    
    const parsed = JSON.parse(jsonData);
    
    // Convert date strings back to Date objects
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
        modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : undefined,
        processedAt: item.processedAt ? new Date(item.processedAt) : undefined,
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        lastSyncAt: item.lastSyncAt ? new Date(item.lastSyncAt) : undefined,
      })) as T;
    }
    
    return parsed as T;
  } catch (error) {
    console.error(`Failed to load ${key} from storage:`, error);
    return defaultValue;
  }
};

export const useBuJoStore = create<BuJoState>((set, get) => ({
  // Initial state
  entries: [],
  collections: [],
  scans: [],
  customSignifiers: [],
  quarterlyPlans: [],
  currentDate: formatDate(new Date()),
  selectedCollection: null,
  
  // Entry management
  addEntry: (entryData) => {
    const entry: BuJoEntry = {
      ...entryData,
      id: generateId(),
      createdAt: new Date(),
      tags: entryData.tags || [],
      contexts: entryData.contexts || [],
      priority: entryData.priority || 'none',
      status: entryData.status || 'incomplete'
    };
    
    set((state) => ({
      entries: [...state.entries, entry]
    }));
    
    // Auto-create daily log if it doesn't exist
    const { getDailyLog, addCollection, currentDate, saveToStorage } = get();
    if (!getDailyLog(entry.collectionDate)) {
      addCollection({
        type: 'daily',
        date: entry.collectionDate,
        entries: []
      });
    }
    
    // Auto-save to storage
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after adding entry:', error)
    );
    
    return entry;
  },
  
  addEntries: (entriesData) => {
    const entries = entriesData.map(entryData => ({
      ...entryData,
      id: generateId(),
      createdAt: new Date(),
      tags: entryData.tags || [],
      contexts: entryData.contexts || [],
      priority: entryData.priority || 'none',
      status: entryData.status || 'incomplete'
    }));
    
    set((state) => ({
      entries: [...state.entries, ...entries]
    }));
    
    // Auto-create daily logs for any dates that don't exist
    const { getDailyLog, addCollection, saveToStorage } = get();
    const uniqueDates = Array.from(new Set(entries.map(e => e.collectionDate)));
    
    uniqueDates.forEach(date => {
      if (!getDailyLog(date)) {
        addCollection({
          type: 'daily',
          date: date,
          entries: []
        });
      }
    });
    
    // Auto-save to storage
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after adding entries:', error)
    );
    
    return entries;
  },
  
  updateEntry: (id, updates) => {
    set((state) => ({
      entries: state.entries.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      )
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after updating entry:', error)
    );
  },
  
  deleteEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter(entry => entry.id !== id)
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after deleting entry:', error)
    );
  },
  
  // Collection management
  addCollection: (collectionData) => {
    const collection: BuJoCollection = {
      ...collectionData,
      id: generateId(),
      createdAt: new Date(),
      modifiedAt: new Date()
    };
    
    set((state) => ({
      collections: [...state.collections, collection]
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after adding collection:', error)
    );
  },
  
  updateCollection: (id, updates) => {
    set((state) => ({
      collections: state.collections.map(collection =>
        collection.id === id 
          ? { ...collection, ...updates, modifiedAt: new Date() }
          : collection
      )
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after updating collection:', error)
    );
  },
  
  addScan: (scanData) => {
    const scan: PageScan = {
      ...scanData,
      id: generateId(),
      processedAt: new Date()
    };
    
    set((state) => ({
      scans: [...state.scans, scan]
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after adding scan:', error)
    );
  },
  
  // Collection queries
  getDailyLog: (date) => {
    const { collections } = get();
    return collections.find(c => c.type === 'daily' && c.date === date) || null;
  },
  
  getMonthlyLog: (yearMonth) => {
    const { collections } = get();
    return collections.find(c => 
      c.type === 'monthly' && c.date.startsWith(yearMonth)
    ) || null;
  },
  
  getFutureLog: () => {
    const { collections } = get();
    return collections.find(c => c.type === 'future') || null;
  },
  
  // Entry queries
  getEntriesByCollection: (collectionId) => {
    const { entries, collections } = get();
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return [];
    
    // For custom collections, use entryIds if available
    if (collection.type === 'custom' && collection.entryIds) {
      return entries.filter(e => collection.entryIds!.includes(e.id));
    }
    
    // For daily/monthly/future collections, use date matching
    return entries.filter(e => e.collectionDate === collection.date);
  },
  
  getCustomCollections: () => {
    const { collections } = get();
    return collections.filter(c => c.type === 'custom');
  },
  
  addCustomCollection: (collectionData) => {
    const collection: BuJoCollection = {
      ...collectionData,
      id: generateId(),
      type: 'custom',
      entries: [],
      entryIds: [],
      smartMatch: true,
      createdAt: new Date(),
      modifiedAt: new Date()
    };
    
    set((state) => ({
      collections: [...state.collections, collection]
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after adding custom collection:', error)
    );
  },
  
  deleteCustomCollection: (id) => {
    set((state) => ({
      collections: state.collections.filter(c => c.id !== id || c.type !== 'custom')
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after deleting custom collection:', error)
    );
  },
  
  assignEntriesToCollection: (collectionId, entryIds) => {
    set((state) => ({
      collections: state.collections.map(collection =>
        collection.id === collectionId 
          ? { ...collection, entryIds, modifiedAt: new Date() }
          : collection
      )
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after assigning entries to collection:', error)
    );
  },
  
  // Custom Signifier management
  addCustomSignifier: (signifierData) => {
    const signifier: CustomSignifier = {
      ...signifierData,
      id: generateId(),
      createdAt: new Date(),
      modifiedAt: new Date()
    };
    
    set((state) => ({
      customSignifiers: [...state.customSignifiers, signifier]
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after adding custom signifier:', error)
    );
  },
  
  updateCustomSignifier: (id, updates) => {
    set((state) => ({
      customSignifiers: state.customSignifiers.map(signifier =>
        signifier.id === id 
          ? { ...signifier, ...updates, modifiedAt: new Date() }
          : signifier
      )
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after updating custom signifier:', error)
    );
  },
  
  deleteCustomSignifier: (id) => {
    set((state) => ({
      customSignifiers: state.customSignifiers.filter(signifier => signifier.id !== id)
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after deleting custom signifier:', error)
    );
  },
  
  getCustomSignifier: (id) => {
    const { customSignifiers } = get();
    return customSignifiers.find(s => s.id === id);
  },
  
  // Quarterly Planning
  addQuarterlyPlan: (planData) => {
    const plan: QuarterlyPlan = {
      ...planData,
      id: generateId(),
      createdAt: new Date(),
      modifiedAt: new Date()
    };
    
    set((state) => ({
      quarterlyPlans: [...state.quarterlyPlans, plan]
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after adding quarterly plan:', error)
    );
  },
  
  updateQuarterlyPlan: (id, updates) => {
    set((state) => ({
      quarterlyPlans: state.quarterlyPlans.map(plan =>
        plan.id === id 
          ? { ...plan, ...updates, modifiedAt: new Date() }
          : plan
      )
    }));
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after updating quarterly plan:', error)
    );
  },
  
  getQuarterlyPlan: (quarter, year) => {
    const { quarterlyPlans } = get();
    return quarterlyPlans.find(p => p.quarter === quarter && p.year === year);
  },
  
  getEntriesByType: (type) => {
    const { entries } = get();
    return entries.filter(e => e.type === type);
  },
  
  getIncompleteEntries: () => {
    const { entries } = get();
    return entries.filter(e => 
      e.type === 'task' && e.status === 'incomplete'
    );
  },
  
  // Migration logic
  migrateEntries: (fromDate, toDate, entryIds) => {
    set((state) => ({
      entries: state.entries.map(entry => {
        if (entryIds.includes(entry.id)) {
          return {
            ...entry,
            status: 'migrated',
            collectionDate: toDate
          };
        }
        return entry;
      })
    }));
  },
  
  // Persistence methods
  saveToStorage: async () => {
    try {
      const { entries, collections, scans, customSignifiers, quarterlyPlans } = get();
      
      // Save each data type separately for better performance
      await Promise.all([
        saveToAsyncStorage(STORAGE_KEYS.ENTRIES, entries),
        saveToAsyncStorage(STORAGE_KEYS.COLLECTIONS, collections),
        saveToAsyncStorage(STORAGE_KEYS.SCANS, scans),
        saveToAsyncStorage(STORAGE_KEYS.CUSTOM_SIGNIFIERS, customSignifiers),
        saveToAsyncStorage(STORAGE_KEYS.QUARTERLY_PLANS, quarterlyPlans),
        saveToAsyncStorage(STORAGE_KEYS.METADATA, {
          lastSaved: new Date().toISOString(),
          version: '1.0.0'
        })
      ]);
      
      console.log('BuJo data saved to storage successfully');
    } catch (error) {
      console.error('Failed to save BuJo data to storage:', error);
      throw error;
    }
  },
  
  loadFromStorage: async () => {
    try {
      const [entries, collections, scans, customSignifiers, quarterlyPlans] = await Promise.all([
        loadFromAsyncStorage<BuJoEntry[]>(STORAGE_KEYS.ENTRIES, []),
        loadFromAsyncStorage<BuJoCollection[]>(STORAGE_KEYS.COLLECTIONS, []),
        loadFromAsyncStorage<PageScan[]>(STORAGE_KEYS.SCANS, []),
        loadFromAsyncStorage<CustomSignifier[]>(STORAGE_KEYS.CUSTOM_SIGNIFIERS, []),
        loadFromAsyncStorage<QuarterlyPlan[]>(STORAGE_KEYS.QUARTERLY_PLANS, [])
      ]);
      
      set({
        entries,
        collections,
        scans,
        customSignifiers,
        quarterlyPlans
      });
      
      console.log(`BuJo data loaded from storage: ${entries.length} entries, ${collections.length} collections, ${scans.length} scans, ${customSignifiers.length} custom signifiers`);
    } catch (error) {
      console.error('Failed to load BuJo data from storage:', error);
      // Don't throw here to allow app to continue with empty state
    }
  },
  
  clearStorage: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ENTRIES),
        AsyncStorage.removeItem(STORAGE_KEYS.COLLECTIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.SCANS),
        AsyncStorage.removeItem(STORAGE_KEYS.METADATA)
      ]);
      
      // Clear in-memory state
      set({
        entries: [],
        collections: [],
        scans: [],
        selectedCollection: null
      });
      
      console.log('BuJo storage cleared successfully');
    } catch (error) {
      console.error('Failed to clear BuJo storage:', error);
      throw error;
    }
  },
  
  // Navigation
  setCurrentDate: (date) => {
    set({ currentDate: date });
    
    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after date change:', error)
    );
  },
  
  // Initialize from storage
  initialize: async () => {
    try {
      await get().loadFromStorage();
      console.log('BuJo store initialized from storage');
    } catch (error) {
      console.error('BuJo store initialization failed:', error);
      // Continue with empty state
      console.log('BuJo store initialized with empty state');
    }
  }
}));