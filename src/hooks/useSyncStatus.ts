import { useState, useEffect, useCallback } from 'react';
import { bujoSyncService } from '../services/supabase/BuJoSyncService';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'never';

export interface SyncStatusData {
  status: SyncStatus;
  lastSyncAt: Date | null;
  isEnabled: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

/**
 * Unified sync status hook for consistent sync state across all screens
 * Provides real-time sync status updates with centralized polling
 */
export const useSyncStatus = (pollingInterval: number = 10000): SyncStatusData => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const updateSyncStatus = useCallback(async (): Promise<void> => {
    try {
      const status = await bujoSyncService.getSyncStatus();
      
      // Determine sync status based on service response
      const currentStatus: SyncStatus = status.isSyncing ? 'syncing' : 
                                       status.lastSyncAt ? 'idle' : 'never';
      
      // Check for stuck syncing state - if syncing for more than 5 minutes, force reset
      if (status.isSyncing && status.lastSyncAt) {
        const timeSinceLastSync = Date.now() - status.lastSyncAt.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceLastSync > fiveMinutes) {
          console.warn('Sync appears stuck - forcing reset');
          try {
            await bujoSyncService.resetSyncState();
            // Re-fetch status after reset
            const resetStatus = await bujoSyncService.getSyncStatus();
            setSyncStatus(resetStatus.lastSyncAt ? 'idle' : 'never');
            setLastSyncAt(resetStatus.lastSyncAt);
            setIsEnabled(resetStatus.isEnabled);
            setIsAuthenticated(resetStatus.isAuthenticated);
            return;
          } catch (resetError) {
            console.error('Failed to reset stuck sync state:', resetError);
            setSyncStatus('error');
            return;
          }
        }
      }
      
      setSyncStatus(currentStatus);
      setLastSyncAt(status.lastSyncAt);
      setIsEnabled(status.isEnabled);
      setIsAuthenticated(status.isAuthenticated);
      
      // Log status changes for debugging
      if (__DEV__) {
        console.log('Sync status updated:', {
          status: currentStatus,
          lastSyncAt: status.lastSyncAt?.toISOString(),
          isEnabled: status.isEnabled,
          isAuthenticated: status.isAuthenticated,
          isSyncing: status.isSyncing,
          timeSinceLastSync: status.lastSyncAt ? Date.now() - status.lastSyncAt.getTime() : 0,
          rawStatus: status
        });
        
        // Special logging for sync state changes
        if (currentStatus !== syncStatus) {
          console.log(`🔄 Sync status changed: ${syncStatus} → ${currentStatus}`);
        }
      }
    } catch (error) {
      console.error('Failed to update sync status:', error);
      setSyncStatus('error');
      setLastSyncAt(null);
      setIsEnabled(false);
      setIsAuthenticated(false);
    }
  }, []);

  // Manual refresh function for immediate updates
  const refresh = useCallback(async (): Promise<void> => {
    await updateSyncStatus();
  }, [updateSyncStatus]);

  // Set up polling for real-time updates
  useEffect(() => {
    // Initial update
    updateSyncStatus();

    // Set up interval for continuous polling
    const interval = setInterval(updateSyncStatus, pollingInterval);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
      if (__DEV__) {
        console.log('Sync status polling stopped');
      }
    };
  }, [updateSyncStatus, pollingInterval]);

  return {
    status: syncStatus,
    lastSyncAt,
    isEnabled,
    isAuthenticated,
    refresh,
  };
};