import { create } from 'zustand';
import { BuJoEntry, BuJoCollection, PageScan } from '../types/BuJo';

interface BuJoState {
  // Data
  entries: BuJoEntry[];
  collections: BuJoCollection[];
  scans: PageScan[];
  
  // Current state
  currentDate: string; // YYYY-MM-DD
  selectedCollection: BuJoCollection | null;
  
  // Actions
  addEntry: (entry: Omit<BuJoEntry, 'id' | 'createdAt'>) => BuJoEntry;
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
  
  // Migration
  migrateEntries: (fromDate: string, toDate: string, entryIds: string[]) => void;
  
  // Initialization
  initialize: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const useBuJoStore = create<BuJoState>((set, get) => ({
  // Initial state
  entries: [],
  collections: [],
  scans: [],
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
    const { getDailyLog, addCollection, currentDate } = get();
    if (!getDailyLog(entry.collectionDate)) {
      addCollection({
        type: 'daily',
        date: entry.collectionDate,
        entries: []
      });
    }
    
    return entry;
  },
  
  updateEntry: (id, updates) => set((state) => ({
    entries: state.entries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    )
  })),
  
  deleteEntry: (id) => set((state) => ({
    entries: state.entries.filter(entry => entry.id !== id)
  })),
  
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
  },
  
  updateCollection: (id, updates) => set((state) => ({
    collections: state.collections.map(collection =>
      collection.id === id 
        ? { ...collection, ...updates, modifiedAt: new Date() }
        : collection
    )
  })),
  
  addScan: (scanData) => {
    const scan: PageScan = {
      ...scanData,
      id: generateId(),
      processedAt: new Date()
    };
    
    set((state) => ({
      scans: [...state.scans, scan]
    }));
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
    
    return entries.filter(e => e.collectionDate === collection.date);
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
  
  // Initialize from storage
  initialize: async () => {
    // TODO: Load from AsyncStorage
    console.log('BuJo store initialized');
  }
}));