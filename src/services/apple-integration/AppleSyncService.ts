import { BuJoEntry } from '../../types/BuJo';
import { useBuJoStore } from '../../stores/BuJoStore';
import { appleIntegrationService } from './AppleIntegrationService';

export class AppleSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  /**
   * Start periodic sync from Apple apps
   */
  startPeriodicSync(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      this.stopPeriodicSync();
    }
    
    this.isRunning = true;
    
    // Run initial sync
    this.performBidirectionalSync().catch(error => 
      console.error('Initial Apple sync failed:', error)
    );
    
    // Set up periodic sync
    const intervalMs = intervalMinutes * 60 * 1000;
    this.syncInterval = setInterval(() => {
      this.performBidirectionalSync().catch(error => 
        console.error('Periodic Apple sync failed:', error)
      );
    }, intervalMs);
    
    console.log(`Apple sync started with ${intervalMinutes} minute intervals`);
  }
  
  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Apple sync stopped');
  }
  
  /**
   * Perform one-time bidirectional sync
   */
  async performBidirectionalSync(): Promise<{ 
    synced: number; 
    errors: number;
    details: { entryId: string; changes?: Partial<BuJoEntry>; error?: string }[];
  }> {
    if (!appleIntegrationService.isAvailable()) {
      console.warn('Apple integration not available, skipping sync');
      return { synced: 0, errors: 0, details: [] };
    }
    
    const { entries, updateEntry } = useBuJoStore.getState();
    
    // Filter entries that have Apple integration
    const appleEntries = entries.filter(entry => 
      entry.appleReminderId || entry.appleEventId
    );
    
    if (appleEntries.length === 0) {
      console.log('No Apple-integrated entries to sync');
      return { synced: 0, errors: 0, details: [] };
    }
    
    let syncedCount = 0;
    let errorCount = 0;
    const details: { entryId: string; changes?: Partial<BuJoEntry>; error?: string }[] = [];
    
    console.log(`Syncing ${appleEntries.length} Apple-integrated entries...`);
    
    // Process entries in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < appleEntries.length; i += batchSize) {
      const batch = appleEntries.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (entry) => {
          try {
            const syncResult = await appleIntegrationService.syncFromApple(entry);
            
            if (syncResult.updated && syncResult.changes) {
              updateEntry(entry.id, syncResult.changes);
              syncedCount++;
              
              details.push({
                entryId: entry.id,
                changes: syncResult.changes
              });
              
              console.log(`Synced entry ${entry.id}:`, syncResult.changes);
            } else {
              details.push({ entryId: entry.id });
            }
          } catch (error) {
            errorCount++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            details.push({
              entryId: entry.id,
              error: errorMessage
            });
            
            console.error(`Failed to sync entry ${entry.id}:`, error);
          }
        })
      );
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < appleEntries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Apple sync completed: ${syncedCount} updated, ${errorCount} errors`);
    
    return {
      synced: syncedCount,
      errors: errorCount,
      details
    };
  }
  
  /**
   * Sync a single entry from Apple apps
   */
  async syncSingleEntry(entryId: string): Promise<{ 
    updated: boolean; 
    changes?: Partial<BuJoEntry>; 
    error?: string 
  }> {
    if (!appleIntegrationService.isAvailable()) {
      return { updated: false, error: 'Apple integration not available' };
    }
    
    const { entries, updateEntry } = useBuJoStore.getState();
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
      return { updated: false, error: 'Entry not found' };
    }
    
    if (!entry.appleReminderId && !entry.appleEventId) {
      return { updated: false, error: 'Entry not linked to Apple apps' };
    }
    
    try {
      const syncResult = await appleIntegrationService.syncFromApple(entry);
      
      if (syncResult.updated && syncResult.changes) {
        updateEntry(entry.id, syncResult.changes);
        return { 
          updated: true, 
          changes: syncResult.changes 
        };
      }
      
      return { updated: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        updated: false, 
        error: errorMessage 
      };
    }
  }
  
  /**
   * Get sync status
   */
  getSyncStatus(): {
    isRunning: boolean;
    intervalMinutes?: number;
  } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.syncInterval ? 5 : undefined // Default interval
    };
  }
}

export const appleSyncService = new AppleSyncService();