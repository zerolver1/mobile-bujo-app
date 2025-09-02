// Optimized Zustand Selectors for BuJo Store
// Prevents unnecessary re-renders by selecting only needed data

import { useBuJoStore } from './BuJoStore';
import { BuJoEntry, BuJoCollection } from '../types/BuJo';

import { useMemo } from 'react';

// Entry selectors - simplified to avoid infinite loops
export const useEntriesForDate = (date: string) => {
  const entries = useBuJoStore(state => state.entries);
  return useMemo(() => 
    entries.filter(entry => entry.collectionDate === date),
    [entries, date]
  );
};

export const useEntriesCount = () => 
  useBuJoStore(state => state.entries.length);

export const useIncompleteTasksCount = () => {
  const entries = useBuJoStore(state => state.entries);
  return useMemo(() => 
    entries.filter(e => e.type === 'task' && e.status === 'incomplete').length,
    [entries]
  );
};

export const useEntriesByType = (type: BuJoEntry['type']) => 
  useBuJoStore(state => 
    state.entries.filter(e => e.type === type)
  );

export const useEntriesWithTag = (tag: string) => 
  useBuJoStore(state => 
    state.entries.filter(e => e.tags?.includes(tag))
  );

// Collection selectors
export const useCurrentDate = () => 
  useBuJoStore(state => state.currentDate);

export const useDailyLog = (date: string) => 
  useBuJoStore(state => state.getDailyLog(date));

export const useCustomCollections = () => 
  useBuJoStore(state => state.getCustomCollections());

// Sync status selectors
export const useSyncStatus = () => 
  useBuJoStore(state => ({
    status: state.syncStatus,
    error: state.syncError,
    lastSyncAt: state.lastSyncAt,
    hasUnsyncedChanges: state.hasUnsyncedChanges()
  }));

// Action selectors - return only the functions needed
export const useEntryActions = () => 
  useBuJoStore(state => ({
    addEntry: state.addEntry,
    updateEntry: state.updateEntry,
    deleteEntry: state.deleteEntry
  }));

export const useCollectionActions = () => 
  useBuJoStore(state => ({
    addCollection: state.addCollection,
    updateCollection: state.updateCollection
  }));

export const useSyncActions = () => 
  useBuJoStore(state => ({
    syncToCloud: state.syncToCloud,
    syncFromCloud: state.syncFromCloud,
    setSyncStatus: state.setSyncStatus
  }));

// Derived data selectors (computed values)
export const useProductivityStats = () => 
  useBuJoStore(state => {
    const tasks = state.entries.filter(e => e.type === 'task');
    const completed = tasks.filter(e => e.status === 'complete');
    const total = tasks.length;
    
    return {
      completionRate: total > 0 ? completed.length / total : 0,
      totalTasks: total,
      completedTasks: completed.length,
      incompleteTasks: total - completed.length
    };
  });

export const useRecentActivity = (days = 7) => 
  useBuJoStore(state => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return state.entries.filter(e => e.createdAt >= cutoffDate);
  });

// Search selector with memoization
export const useSearchEntries = (query: string) => 
  useBuJoStore(state => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return state.entries.filter(entry =>
      entry.content.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      entry.contexts?.some(context => context.toLowerCase().includes(lowerQuery))
    );
  });

// Migration helpers
export const useMigrationCandidates = () => 
  useBuJoStore(state => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return state.entries.filter(entry => 
      entry.type === 'task' && 
      entry.status === 'incomplete' &&
      new Date(entry.collectionDate) < oneDayAgo
    );
  });

// Memory optimization - only re-render when specific fields change
export const useEntryById = (id: string) => 
  useBuJoStore(state => 
    state.entries.find(e => e.id === id)
  );

export const useCollectionById = (id: string) => 
  useBuJoStore(state => 
    state.collections.find(c => c.id === id)
  );