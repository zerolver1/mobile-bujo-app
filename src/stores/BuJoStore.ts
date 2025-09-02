import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BuJoEntry, BuJoCollection, PageScan, CustomSignifier, QuarterlyPlan, CrossReference } from '../types/BuJo';
import { bujoSyncService } from '../services/supabase/BuJoSyncService';

interface BuJoState {
  // Data
  entries: BuJoEntry[];
  collections: BuJoCollection[];
  scans: PageScan[];
  customSignifiers: CustomSignifier[];
  quarterlyPlans: QuarterlyPlan[];
  crossReferences: CrossReference[];
  
  // Current state
  currentDate: string; // YYYY-MM-DD
  selectedCollection: BuJoCollection | null;
  
  // Cloud sync state
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError: string | null;
  lastSyncAt: Date | null;
  
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
  
  // Cross-references
  addCrossReference: (reference: CrossReference) => void;
  removeCrossReference: (sourceEntryId: string, targetEntryId: string) => void;
  getCrossReferencesForEntry: (entryId: string) => CrossReference[];
  getLinkedEntries: (entryId: string) => BuJoEntry[];
  
  // Persistence
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearStorage: () => Promise<void>;
  
  // Initialization
  initialize: () => Promise<void>;
  
  // Cloud sync
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error', error?: string) => void;
  
  // Performance optimization - selective selectors
  getEntriesForDate: (date: string) => BuJoEntry[];
  getEntriesCount: () => number;
  hasUnsyncedChanges: () => boolean;
}

// Storage keys
const STORAGE_KEYS = {
  ENTRIES: 'bujo_entries',
  COLLECTIONS: 'bujo_collections',
  SCANS: 'bujo_scans',
  CUSTOM_SIGNIFIERS: 'bujo_custom_signifiers',
  QUARTERLY_PLANS: 'bujo_quarterly_plans',
  CROSS_REFERENCES: 'bujo_cross_references',
  METADATA: 'bujo_metadata'
};

// Generate proper UUID v4 for database compatibility
const generateId = () => {
  // Simple UUID v4 generation for React Native
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

export const useBuJoStore = create<BuJoState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    entries: [],
    collections: [],
    scans: [],
    customSignifiers: [],
    quarterlyPlans: [],
    crossReferences: [],
    currentDate: formatDate(new Date()),
    selectedCollection: null,
    syncStatus: 'idle' as const,
    syncError: null,
    lastSyncAt: null,
  
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
    
    // Auto-save to storage and sync to cloud
    const syncPromises = [
      saveToStorage()
    ];
    
    if (bujoSyncService) {
      syncPromises.push(bujoSyncService.createEntry(entry));
    }
    
    Promise.all(syncPromises).catch(error => 
      console.error('Failed to save/sync after adding entry:', error)
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
    
    // Auto-save to storage and sync to cloud
    const { saveToStorage } = get();
    const updatedEntry = get().entries.find(e => e.id === id);
    
    const syncPromises = [
      saveToStorage()
    ];
    
    if (bujoSyncService && updatedEntry) {
      syncPromises.push(bujoSyncService.updateEntry(id, updatedEntry));
    }
    
    Promise.all(syncPromises).catch(error => 
      console.error('Failed to save/sync after updating entry:', error)
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
  
  // Cross-reference methods
  addCrossReference: (reference) => {
    set((state) => {
      // Add to cross-references list
      const newCrossReferences = [...state.crossReferences, reference];
      
      // Update entries to include linked entry IDs
      const updatedEntries = state.entries.map(entry => {
        if (entry.id === reference.sourceEntryId) {
          const linkedEntries = entry.linkedEntries || [];
          return {
            ...entry,
            linkedEntries: [...linkedEntries, reference.targetEntryId]
          };
        }
        if (entry.id === reference.targetEntryId) {
          const referencedBy = entry.referencedBy || [];
          return {
            ...entry,
            referencedBy: [...referencedBy, reference.sourceEntryId]
          };
        }
        return entry;
      });
      
      return {
        crossReferences: newCrossReferences,
        entries: updatedEntries
      };
    });

    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after adding cross-reference:', error)
    );
  },

  removeCrossReference: (sourceEntryId, targetEntryId) => {
    set((state) => {
      // Remove from cross-references list
      const newCrossReferences = state.crossReferences.filter(ref => 
        !(ref.sourceEntryId === sourceEntryId && ref.targetEntryId === targetEntryId)
      );
      
      // Update entries to remove linked entry IDs
      const updatedEntries = state.entries.map(entry => {
        if (entry.id === sourceEntryId) {
          const linkedEntries = entry.linkedEntries || [];
          return {
            ...entry,
            linkedEntries: linkedEntries.filter(id => id !== targetEntryId)
          };
        }
        if (entry.id === targetEntryId) {
          const referencedBy = entry.referencedBy || [];
          return {
            ...entry,
            referencedBy: referencedBy.filter(id => id !== sourceEntryId)
          };
        }
        return entry;
      });
      
      return {
        crossReferences: newCrossReferences,
        entries: updatedEntries
      };
    });

    // Auto-save to storage
    const { saveToStorage } = get();
    saveToStorage().catch(error => 
      console.error('Failed to auto-save after removing cross-reference:', error)
    );
  },

  getCrossReferencesForEntry: (entryId) => {
    const { crossReferences } = get();
    return crossReferences.filter(ref => 
      ref.sourceEntryId === entryId || ref.targetEntryId === entryId
    );
  },

  getLinkedEntries: (entryId) => {
    const { entries } = get();
    const entry = entries.find(e => e.id === entryId);
    if (!entry || !entry.linkedEntries) return [];
    
    return entries.filter(e => entry.linkedEntries!.includes(e.id));
  },
  
  // Persistence methods
  saveToStorage: async () => {
    try {
      const { entries, collections, scans, customSignifiers, quarterlyPlans, crossReferences } = get();
      
      // Save each data type separately for better performance
      await Promise.all([
        saveToAsyncStorage(STORAGE_KEYS.ENTRIES, entries),
        saveToAsyncStorage(STORAGE_KEYS.COLLECTIONS, collections),
        saveToAsyncStorage(STORAGE_KEYS.SCANS, scans),
        saveToAsyncStorage(STORAGE_KEYS.CUSTOM_SIGNIFIERS, customSignifiers),
        saveToAsyncStorage(STORAGE_KEYS.QUARTERLY_PLANS, quarterlyPlans),
        saveToAsyncStorage(STORAGE_KEYS.CROSS_REFERENCES, crossReferences),
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
      const [entries, collections, scans, customSignifiers, quarterlyPlans, crossReferences] = await Promise.all([
        loadFromAsyncStorage<BuJoEntry[]>(STORAGE_KEYS.ENTRIES, []),
        loadFromAsyncStorage<BuJoCollection[]>(STORAGE_KEYS.COLLECTIONS, []),
        loadFromAsyncStorage<PageScan[]>(STORAGE_KEYS.SCANS, []),
        loadFromAsyncStorage<CustomSignifier[]>(STORAGE_KEYS.CUSTOM_SIGNIFIERS, []),
        loadFromAsyncStorage<QuarterlyPlan[]>(STORAGE_KEYS.QUARTERLY_PLANS, []),
        loadFromAsyncStorage<CrossReference[]>(STORAGE_KEYS.CROSS_REFERENCES, [])
      ]);
      
      set({
        entries,
        collections,
        scans,
        customSignifiers,
        quarterlyPlans,
        crossReferences
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
  
  // Migrate old short IDs to proper UUIDs
  migrateOldIds: () => {
    const { entries, collections } = get();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let migrationCount = 0;
    
    // Migrate entries with old IDs
    const updatedEntries = entries.map(entry => {
      if (!uuidRegex.test(entry.id)) {
        migrationCount++;
        return { ...entry, id: generateId() };
      }
      return entry;
    });
    
    // Migrate collections with old IDs
    const updatedCollections = collections.map(collection => {
      if (!uuidRegex.test(collection.id)) {
        migrationCount++;
        return { ...collection, id: generateId() };
      }
      return collection;
    });
    
    if (migrationCount > 0) {
      console.log(`🔄 Migrated ${migrationCount} items to proper UUID format`);
      set({ entries: updatedEntries, collections: updatedCollections });
      // Save the updated data
      get().saveToStorage().catch(console.error);
    }
  },

  // Initialize from storage
  initialize: async () => {
    try {
      await get().loadFromStorage();
      console.log('BuJo store initialized from storage');
      
      // Migrate any old short IDs to proper UUIDs
      get().migrateOldIds();
      
      // Attempt to sync with cloud if service available (silently)
      try {
        await get().syncFromCloud();
      } catch (syncError) {
        // Silent failure - app works fine without cloud sync
      }
    } catch (error) {
      console.error('BuJo store initialization failed:', error);
      // Continue with empty state
      console.log('BuJo store initialized with empty state');
    }
  },
  
  // Cloud sync methods
  syncToCloud: async () => {
    if (!bujoSyncService) return;
    
    set({ syncStatus: 'syncing', syncError: null });
    
    try {
      const { entries, collections } = get();
      
      // Sync entries in batches for performance
      const batchSize = 50;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        await Promise.all(batch.map(entry => bujoSyncService.createEntry(entry)));
      }
      
      // Sync collections
      await Promise.all(collections.map(collection => 
        bujoSyncService.createCollection(collection)
      ));
      
      set({ 
        syncStatus: 'idle', 
        lastSyncAt: new Date() 
      });
      
      console.log('✅ Cloud sync completed successfully');
    } catch (error) {
      console.error('Cloud sync failed:', error);
      set({ 
        syncStatus: 'error', 
        syncError: error instanceof Error ? error.message : 'Unknown sync error' 
      });
    }
  },
  
  syncFromCloud: async () => {
    if (!bujoSyncService) return;
    
    set({ syncStatus: 'syncing', syncError: null });
    
    try {
      const [cloudEntries, cloudCollections] = await Promise.all([
        bujoSyncService.getEntries().catch(() => []), // Gracefully handle missing tables
        bujoSyncService.getCollections().catch(() => [])
      ]);
      
      if (cloudEntries.length === 0 && cloudCollections.length === 0) {
        // No cloud data available (probably tables don't exist yet)
        console.log('ℹ️ No cloud data available - using local data only');
        set({ 
          syncStatus: 'idle', 
          syncError: 'Database tables not yet created. Local data only.' 
        });
        return;
      }
      
      // Simple merge strategy: cloud data wins for newer items
      const localEntries = get().entries;
      const mergedEntries = [...cloudEntries];
      
      // Add local entries that don't exist in cloud
      localEntries.forEach(localEntry => {
        const existsInCloud = cloudEntries.some(cloudEntry => cloudEntry.id === localEntry.id);
        if (!existsInCloud) {
          mergedEntries.push(localEntry);
        }
      });
      
      set({
        entries: mergedEntries,
        collections: cloudCollections,
        syncStatus: 'idle',
        lastSyncAt: new Date()
      });
      
      // Save merged data locally
      await get().saveToStorage();
      
      console.log(`✅ Synced from cloud: ${cloudEntries.length} entries, ${cloudCollections.length} collections`);
    } catch (error) {
      console.warn('Cloud sync from failed:', error);
      set({ 
        syncStatus: 'idle', // Don't show as error if it's just missing tables
        syncError: 'Cloud sync not available. Using local data only.' 
      });
    }
  },
  
  setSyncStatus: (status, error) => {
    set({ 
      syncStatus: status, 
      syncError: error || null 
    });
  },
  
  // Performance optimization - selective selectors
  getEntriesForDate: (date) => {
    const { entries } = get();
    return entries.filter(entry => entry.collectionDate === date);
  },
  
  getEntriesCount: () => {
    return get().entries.length;
  },
  
  hasUnsyncedChanges: () => {
    const { lastSyncAt } = get();
    if (!lastSyncAt) return true;
    
    const { entries } = get();
    return entries.some(entry => entry.createdAt > lastSyncAt);
  }
})));