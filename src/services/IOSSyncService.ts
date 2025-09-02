// iOS Sync Service
// Integrates BuJo entries with Apple Reminders, Calendar, and Notes

import { Platform } from 'react-native';
import { BuJoEntry } from '../types/BuJo';
import { bujoSyncService } from './supabase/BuJoSyncService';

// Note: These would be replaced with actual iOS native module imports
// For now, using mock implementations for React Native compatibility

export interface AppleReminderItem {
  identifier: string;
  title: string;
  notes?: string;
  isCompleted: boolean;
  priority: number; // 0 = none, 1 = high, 5 = medium, 9 = low
  dueDate?: Date;
  creationDate: Date;
  modificationDate: Date;
  list?: string; // List name
}

export interface AppleCalendarEvent {
  eventIdentifier: string;
  title: string;
  notes?: string;
  startDate: Date;
  endDate?: Date;
  isAllDay: boolean;
  calendar?: string; // Calendar name
  location?: string;
}

export interface IOSSyncState {
  entryId: string;
  appleReminderId?: string;
  appleCalendarId?: string;
  lastSyncedAt: Date;
  syncDirection: 'to_ios' | 'from_ios' | 'bidirectional';
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  conflictData?: any;
}

export class IOSSyncService {
  private isEnabled: boolean = Platform.OS === 'ios';
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize iOS sync if available
    this.initializeIOSSync();
  }

  private async initializeIOSSync() {
    if (!this.isEnabled) {
      console.log('iOS sync not available on this platform');
      return;
    }

    try {
      // Request permissions for Reminders and Calendar
      await this.requestPermissions();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      console.log('✅ iOS sync service initialized');
    } catch (error) {
      console.warn('Failed to initialize iOS sync:', error);
      this.isEnabled = false;
    }
  }

  // Request permissions for iOS native apps
  private async requestPermissions(): Promise<void> {
    // Mock implementation - in real app, would use native modules
    console.log('🔐 Requesting iOS permissions for Reminders and Calendar...');
    
    // TODO: Implement actual permission requests
    // const remindersPermission = await Reminders.requestPermission();
    // const calendarPermission = await Calendar.requestPermission();
    
    return Promise.resolve();
  }

  // Sync BuJo entry to Apple Reminders
  async syncEntryToReminders(entry: BuJoEntry): Promise<string | null> {
    if (!this.isEnabled || entry.type !== 'task') {
      return null;
    }

    try {
      // Convert BuJo entry to Apple Reminder format
      const reminderData: AppleReminderItem = {
        identifier: '', // Will be set by iOS
        title: entry.content,
        notes: this.generateReminderNotes(entry),
        isCompleted: entry.status === 'complete',
        priority: this.convertPriorityToApple(entry.priority),
        dueDate: entry.dueDate || entry.scheduledDate,
        creationDate: entry.createdAt,
        modificationDate: new Date(),
        list: 'BuJo Tasks', // Default list
      };

      // Mock implementation - would use native module
      const reminderId = await this.createAppleReminder(reminderData);
      
      if (reminderId) {
        // Track the sync in our database
        await bujoSyncService.trackTransition(
          entry.id,
          entry,
          entry,
          'synced_to_reminders',
          'ios_integration',
          { appleReminderId: reminderId, timestamp: Date.now() }
        );

        console.log(`✅ Synced entry "${entry.content}" to Apple Reminders`);
      }

      return reminderId;
    } catch (error) {
      console.error('Failed to sync to Apple Reminders:', error);
      return null;
    }
  }

  // Sync BuJo entry to Apple Calendar
  async syncEntryToCalendar(entry: BuJoEntry): Promise<string | null> {
    if (!this.isEnabled || entry.type !== 'event') {
      return null;
    }

    try {
      // Convert BuJo entry to Apple Calendar event
      const eventData: AppleCalendarEvent = {
        eventIdentifier: '', // Will be set by iOS
        title: entry.content,
        notes: this.generateEventNotes(entry),
        startDate: entry.scheduledDate || entry.dueDate || entry.createdAt,
        endDate: this.calculateEventEndDate(entry),
        isAllDay: !entry.scheduledDate, // If no specific time, make it all-day
        calendar: 'BuJo Events', // Default calendar
        location: this.extractLocationFromContent(entry.content),
      };

      // Mock implementation - would use native module
      const eventId = await this.createAppleCalendarEvent(eventData);
      
      if (eventId) {
        // Track the sync in our database
        await bujoSyncService.trackTransition(
          entry.id,
          entry,
          entry,
          'synced_to_calendar',
          'ios_integration',
          { appleCalendarId: eventId, timestamp: Date.now() }
        );

        console.log(`✅ Synced entry "${entry.content}" to Apple Calendar`);
      }

      return eventId;
    } catch (error) {
      console.error('Failed to sync to Apple Calendar:', error);
      return null;
    }
  }

  // Sync from Apple Reminders back to BuJo
  async syncFromReminders(): Promise<BuJoEntry[]> {
    if (!this.isEnabled) return [];

    try {
      // Get all reminders from BuJo list
      const reminders = await this.getAppleReminders('BuJo Tasks');
      const updatedEntries: BuJoEntry[] = [];

      for (const reminder of reminders) {
        // Check if we have this reminder tracked
        const existingEntry = await this.findEntryByAppleId(reminder.identifier, 'reminder');
        
        if (existingEntry) {
          // Update existing entry if reminder was modified in Apple app
          if (reminder.modificationDate > existingEntry.lastSyncAt!) {
            const updatedEntry = await this.updateEntryFromReminder(existingEntry, reminder);
            updatedEntries.push(updatedEntry);
          }
        } else {
          // Create new BuJo entry from Apple reminder
          const newEntry = await this.createEntryFromReminder(reminder);
          updatedEntries.push(newEntry);
        }
      }

      if (updatedEntries.length > 0) {
        console.log(`✅ Synced ${updatedEntries.length} updates from Apple Reminders`);
      }

      return updatedEntries;
    } catch (error) {
      console.error('Failed to sync from Apple Reminders:', error);
      return [];
    }
  }

  // Start periodic sync with iOS apps
  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 5 minutes when app is active
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncFromReminders();
        // Could also sync from Calendar here
      } catch (error) {
        console.warn('Periodic iOS sync failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Stop periodic sync
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Handle bidirectional conflict resolution
  async resolveConflict(entry: BuJoEntry, appleData: any, conflictType: 'reminder' | 'calendar'): Promise<BuJoEntry> {
    // Simple conflict resolution: last modified wins
    const entryModified = entry.lastSyncAt || entry.createdAt;
    const appleModified = conflictType === 'reminder' 
      ? (appleData as AppleReminderItem).modificationDate
      : (appleData as AppleCalendarEvent).startDate; // Simplified

    if (appleModified > entryModified) {
      // Apple data is newer - update BuJo entry
      return conflictType === 'reminder'
        ? await this.updateEntryFromReminder(entry, appleData)
        : entry; // Simplified for calendar
    } else {
      // BuJo entry is newer - update Apple item
      if (conflictType === 'reminder') {
        await this.updateAppleReminder(appleData.identifier, entry);
      }
      return entry;
    }
  }

  // Mock native module implementations (would be replaced with actual native code)
  private async createAppleReminder(data: AppleReminderItem): Promise<string> {
    // Mock implementation
    return `reminder_${Date.now()}`;
  }

  private async createAppleCalendarEvent(data: AppleCalendarEvent): Promise<string> {
    // Mock implementation
    return `event_${Date.now()}`;
  }

  private async getAppleReminders(listName: string): Promise<AppleReminderItem[]> {
    // Mock implementation - would use native module to get actual reminders
    return [];
  }

  private async updateAppleReminder(reminderId: string, entry: BuJoEntry): Promise<void> {
    // Mock implementation
    console.log(`Updating Apple reminder ${reminderId} from BuJo entry`);
  }

  // Helper methods
  private generateReminderNotes(entry: BuJoEntry): string {
    let notes = `Created in BuJo on ${entry.createdAt.toLocaleDateString()}\n`;
    
    if (entry.tags && entry.tags.length > 0) {
      notes += `Tags: ${entry.tags.map(t => '#' + t).join(', ')}\n`;
    }
    
    if (entry.contexts && entry.contexts.length > 0) {
      notes += `Contexts: ${entry.contexts.map(c => '@' + c).join(', ')}\n`;
    }
    
    notes += `\nEntry ID: ${entry.id}`;
    return notes;
  }

  private generateEventNotes(entry: BuJoEntry): string {
    let notes = `BuJo Event created on ${entry.createdAt.toLocaleDateString()}\n`;
    
    if (entry.tags && entry.tags.length > 0) {
      notes += `Tags: ${entry.tags.map(t => '#' + t).join(', ')}\n`;
    }
    
    notes += `\nEntry ID: ${entry.id}`;
    return notes;
  }

  private convertPriorityToApple(priority: BuJoEntry['priority']): number {
    switch (priority) {
      case 'high': return 1;
      case 'medium': return 5;
      case 'low': return 9;
      default: return 0;
    }
  }

  private calculateEventEndDate(entry: BuJoEntry): Date {
    const startDate = entry.scheduledDate || entry.dueDate || entry.createdAt;
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration
    return endDate;
  }

  private extractLocationFromContent(content: string): string | undefined {
    // Simple location extraction - could be enhanced with regex
    const locationMatch = content.match(/@(\w+)/);
    return locationMatch ? locationMatch[1] : undefined;
  }

  private async findEntryByAppleId(appleId: string, type: 'reminder' | 'calendar'): Promise<BuJoEntry | null> {
    // Would query database for entry with matching Apple ID
    return null;
  }

  private async updateEntryFromReminder(entry: BuJoEntry, reminder: AppleReminderItem): Promise<BuJoEntry> {
    // Update BuJo entry from Apple reminder data
    const updatedEntry: BuJoEntry = {
      ...entry,
      content: reminder.title,
      status: reminder.isCompleted ? 'complete' : 'incomplete',
      dueDate: reminder.dueDate,
      lastSyncAt: new Date(),
    };

    // Track the sync
    await bujoSyncService.trackTransition(
      entry.id,
      entry,
      updatedEntry,
      'synced_from_reminders',
      'ios_integration',
      { appleReminderId: reminder.identifier }
    );

    return updatedEntry;
  }

  private async createEntryFromReminder(reminder: AppleReminderItem): Promise<BuJoEntry> {
    // Create new BuJo entry from Apple reminder
    const newEntry: BuJoEntry = {
      id: `apple_reminder_${reminder.identifier}`,
      type: 'task',
      content: reminder.title,
      status: reminder.isCompleted ? 'complete' : 'incomplete',
      priority: this.convertApplePriorityToBuJo(reminder.priority),
      createdAt: reminder.creationDate,
      dueDate: reminder.dueDate,
      collection: 'daily',
      collectionDate: new Date().toISOString().split('T')[0],
      lastSyncAt: new Date(),
      contexts: [], // Could extract from notes
      tags: [], // Could extract from notes
    };

    // Track the creation
    await bujoSyncService.trackTransition(
      newEntry.id,
      newEntry,
      newEntry,
      'synced_from_reminders',
      'ios_integration',
      { appleReminderId: reminder.identifier, source: 'apple_reminders' }
    );

    return newEntry;
  }

  private convertApplePriorityToBuJo(applePriority: number): BuJoEntry['priority'] {
    if (applePriority === 1) return 'high';
    if (applePriority <= 5) return 'medium';
    if (applePriority <= 9) return 'low';
    return 'none';
  }

  // Public API methods
  isIOSSyncEnabled(): boolean {
    return this.isEnabled;
  }

  async syncEntry(entry: BuJoEntry): Promise<void> {
    if (!this.isEnabled) return;

    switch (entry.type) {
      case 'task':
        await this.syncEntryToReminders(entry);
        break;
      case 'event':
        await this.syncEntryToCalendar(entry);
        break;
      default:
        // Other entry types don't sync to iOS apps
        break;
    }
  }

  async getSyncStatus(entryId: string): Promise<IOSSyncState | null> {
    // Would query database for sync status
    // Mock implementation
    return null;
  }
}

// Singleton instance
export const iosSyncService = new IOSSyncService();