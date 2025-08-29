import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { appleSyncService } from '../services/apple-integration/AppleSyncService';
import { BuJoEntry } from '../types/BuJo';

export interface AppleSyncState {
  isRunning: boolean;
  lastSync?: Date;
  isSyncing: boolean;
  syncStats: {
    total: number;
    synced: number;
    errors: number;
  };
}

export interface UseAppleSyncReturn {
  syncState: AppleSyncState;
  startSync: (intervalMinutes?: number) => void;
  stopSync: () => void;
  performManualSync: () => Promise<void>;
  syncSingleEntry: (entryId: string) => Promise<{ updated: boolean; changes?: Partial<BuJoEntry>; error?: string }>;
}

export const useAppleSync = (): UseAppleSyncReturn => {
  const [syncState, setSyncState] = useState<AppleSyncState>({
    isRunning: false,
    isSyncing: false,
    syncStats: {
      total: 0,
      synced: 0,
      errors: 0
    }
  });
  
  // Handle app state changes for smart syncing
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Sync when app becomes active (user returns from Apple apps)
      if (nextAppState === 'active' && syncState.isRunning && !syncState.isSyncing) {
        performManualSync().catch(error => 
          console.error('App state sync failed:', error)
        );
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [syncState.isRunning, syncState.isSyncing]);
  
  const startSync = (intervalMinutes: number = 5) => {
    appleSyncService.startPeriodicSync(intervalMinutes);
    setSyncState(prev => ({
      ...prev,
      isRunning: true
    }));
  };
  
  const stopSync = () => {
    appleSyncService.stopPeriodicSync();
    setSyncState(prev => ({
      ...prev,
      isRunning: false
    }));
  };
  
  const performManualSync = async (): Promise<void> => {
    if (syncState.isSyncing) {
      console.log('Sync already in progress, skipping manual sync');
      return;
    }
    
    setSyncState(prev => ({
      ...prev,
      isSyncing: true
    }));
    
    try {
      const result = await appleSyncService.performBidirectionalSync();
      
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        syncStats: {
          total: result.details.length,
          synced: result.synced,
          errors: result.errors
        }
      }));
    } catch (error) {
      console.error('Manual sync failed:', error);
      
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        syncStats: {
          ...prev.syncStats,
          errors: prev.syncStats.errors + 1
        }
      }));
    }
  };
  
  const syncSingleEntry = async (entryId: string) => {
    return await appleSyncService.syncSingleEntry(entryId);
  };
  
  return {
    syncState,
    startSync,
    stopSync,
    performManualSync,
    syncSingleEntry
  };
};