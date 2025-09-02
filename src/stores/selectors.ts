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

export const useEntriesByType = (type: BuJoEntry['type']) => {
  const entries = useBuJoStore(state => state.entries);
  return useMemo(() => 
    entries.filter(e => e.type === type),
    [entries, type]
  );
};

export const useEntriesWithTag = (tag: string) => {
  const entries = useBuJoStore(state => state.entries);
  return useMemo(() => 
    entries.filter(e => e.tags?.includes(tag)),
    [entries, tag]
  );
};

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
export const useProductivityStats = () => {
  const entries = useBuJoStore(state => state.entries);
  return useMemo(() => {
    const tasks = entries.filter(e => e.type === 'task');
    const completed = tasks.filter(e => e.status === 'complete');
    const total = tasks.length;
    
    return {
      completionRate: total > 0 ? completed.length / total : 0,
      totalTasks: total,
      completedTasks: completed.length,
      incompleteTasks: total - completed.length
    };
  }, [entries]);
};

export const useRecentActivity = (days = 7) => {
  const entries = useBuJoStore(state => state.entries);
  return useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return entries.filter(e => e.createdAt >= cutoffDate);
  }, [entries, days]);
};

// Search selector with memoization
export const useSearchEntries = (query: string) => {
  const entries = useBuJoStore(state => state.entries);
  return useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return entries.filter(entry =>
      entry.content.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      entry.contexts?.some(context => context.toLowerCase().includes(lowerQuery))
    );
  }, [entries, query]);
};

// Migration helpers
export const useMigrationCandidates = () => {
  const entries = useBuJoStore(state => state.entries);
  return useMemo(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return entries.filter(entry => 
      entry.type === 'task' && 
      entry.status === 'incomplete' &&
      new Date(entry.collectionDate) < oneDayAgo
    );
  }, [entries]);
};

// Memory optimization - only re-render when specific fields change
export const useEntryById = (id: string) => 
  useBuJoStore(state => 
    state.entries.find(e => e.id === id)
  );

export const useCollectionById = (id: string) => 
  useBuJoStore(state => 
    state.collections.find(c => c.id === id)
  );