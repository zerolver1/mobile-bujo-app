import { NativeModules, Platform } from 'react-native';
import { BuJoEntry } from '../../types/BuJo';

interface AppleIntegrationModule {
  requestPermissions(): Promise<{
    reminders: boolean;
    calendar: boolean;
  }>;
  
  createReminder(data: {
    title: string;
    notes?: string;
    dueDate?: number; // timestamp in milliseconds
    priority?: 'high' | 'medium' | 'low' | 'none';
    completed?: boolean;
  }): Promise<{
    id: string;
    success: boolean;
    listId: string;
  }>;
  
  createEvent(data: {
    title: string;
    notes?: string;
    startDate: number; // timestamp in milliseconds
    endDate: number; // timestamp in milliseconds
    allDay?: boolean;
    location?: string;
  }): Promise<{
    id: string;
    success: boolean;
    calendarId: string;
  }>;
  
  updateReminderStatus(reminderId: string, completed: boolean): Promise<{
    success: boolean;
  }>;
}

class AppleIntegrationService {
  private nativeModule: AppleIntegrationModule | null = null;
  
  constructor() {
    if (Platform.OS === 'ios') {
      this.nativeModule = NativeModules.AppleIntegration;
    }
  }
  
  /**
   * Check if Apple integration is available (iOS only)
   */
  isAvailable(): boolean {
    return Platform.OS === 'ios' && this.nativeModule !== null;
  }
  
  /**
   * Request permissions for Reminders and Calendar
   */
  async requestPermissions(): Promise<{ reminders: boolean; calendar: boolean }> {
    if (!this.isAvailable() || !this.nativeModule) {
      throw new Error('Apple integration not available on this platform');
    }
    
    try {
      return await this.nativeModule.requestPermissions();
    } catch (error) {
      console.error('Failed to request Apple permissions:', error);
      throw error;
    }
  }
  
  /**
   * Sync a BuJo entry to Apple apps
   */
  async syncEntry(entry: BuJoEntry): Promise<{ reminderId?: string; eventId?: string }> {
    if (!this.isAvailable()) {
      console.warn('Apple integration not available, skipping sync');
      return {};
    }
    
    const result: { reminderId?: string; eventId?: string } = {};
    
    try {
      if (entry.type === 'task') {
        const reminderResult = await this.createReminder(entry);
        result.reminderId = reminderResult.id;
      } else if (entry.type === 'event') {
        const eventResult = await this.createEvent(entry);
        result.eventId = eventResult.id;
      }
      
      return result;
    } catch (error) {
      console.error('Failed to sync entry to Apple apps:', error);
      throw error;
    }
  }
  
  /**
   * Create a reminder in Apple Reminders
   */
  async createReminder(entry: BuJoEntry): Promise<{ id: string; success: boolean; listId: string }> {
    if (!this.nativeModule) {
      throw new Error('Apple integration not available');
    }
    
    const reminderData = {
      title: entry.content,
      notes: this.buildNotesForEntry(entry),
      dueDate: entry.dueDate?.getTime(),
      priority: entry.priority,
      completed: entry.status === 'complete'
    };
    
    return await this.nativeModule.createReminder(reminderData);
  }
  
  /**
   * Create an event in Apple Calendar
   */
  async createEvent(entry: BuJoEntry): Promise<{ id: string; success: boolean; calendarId: string }> {
    if (!this.nativeModule) {
      throw new Error('Apple integration not available');
    }
    
    // For events, we need start and end times
    const startDate = entry.dueDate || new Date();
    const endDate = new Date(startDate.getTime() + (60 * 60 * 1000)); // Default 1 hour duration
    
    const eventData = {
      title: entry.content,
      notes: this.buildNotesForEntry(entry),
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      allDay: !this.hasTimeInfo(entry.content),
      location: this.extractLocation(entry.content)
    };
    
    return await this.nativeModule.createEvent(eventData);
  }
  
  /**
   * Update reminder completion status
   */
  async updateReminderStatus(reminderId: string, completed: boolean): Promise<void> {
    if (!this.nativeModule) {
      throw new Error('Apple integration not available');
    }
    
    await this.nativeModule.updateReminderStatus(reminderId, completed);
  }
  
  /**
   * Build notes section for Apple app entries
   */
  private buildNotesForEntry(entry: BuJoEntry): string {
    let notes = `From Bullet Journal - ${entry.collectionDate}\n\n`;
    
    // Add contexts and tags
    if (entry.contexts.length > 0) {
      notes += `Contexts: ${entry.contexts.map(ctx => `@${ctx}`).join(', ')}\n`;
    }
    
    if (entry.tags.length > 0) {
      notes += `Tags: ${entry.tags.map(tag => `#${tag}`).join(', ')}\n`;
    }
    
    // Add source info
    if (entry.sourceImage) {
      notes += `\nExtracted from scanned journal page`;
      if (entry.ocrConfidence) {
        notes += ` (${Math.round(entry.ocrConfidence * 100)}% confidence)`;
      }
    }
    
    // Add priority info
    if (entry.priority !== 'none') {
      notes += `\nPriority: ${entry.priority}`;
    }
    
    return notes.trim();
  }
  
  /**
   * Check if entry content contains time information
   */
  private hasTimeInfo(content: string): boolean {
    const timePattern = /\b\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\b|\b\d{1,2}\s*(AM|PM|am|pm)\b/;
    return timePattern.test(content);
  }
  
  /**
   * Extract location information from content
   */
  private extractLocation(content: string): string | undefined {
    // Look for @location pattern
    const locationMatch = content.match(/@([a-zA-Z0-9\s]+)/);
    if (locationMatch) {
      return locationMatch[1].trim();
    }
    
    // Look for "at [location]" pattern
    const atMatch = content.match(/\bat\s+([A-Z][a-zA-Z0-9\s]+)/);
    if (atMatch) {
      return atMatch[1].trim();
    }
    
    return undefined;
  }
}

export const appleIntegrationService = new AppleIntegrationService();