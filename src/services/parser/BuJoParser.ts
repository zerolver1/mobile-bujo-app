import { BuJoEntry } from '../../types/BuJo';

export class BuJoParser {
  private readonly patterns = {
    // Core bullets
    task: /^[•\-\*]\s+(.+)$/,
    taskComplete: /^[xX✓]\s*[•\-\*]?\s*(.+)$/,
    taskMigrated: /^[>→]\s*[•\-\*]?\s*(.+)$/,
    taskScheduled: /^[<←]\s*[•\-\*]?\s*(.+)$/,
    event: /^[○◦]\s+(.+)$/,
    note: /^[—–\-]\s+(.+)$/,
    
    // Context & tags
    context: /@([a-zA-Z0-9_]+)/g,
    hashtag: /#([a-zA-Z0-9_]+)/g,
    priority: /\*\s*$/,
    
    // Dates and times
    date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\w+\s+\d{1,2},?\s+\d{4})|(\d{1,2}\s+\w+\s+\d{4})/g,
    time: /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/g,
    timeRange: /(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/g
  };

  parse(text: string): BuJoEntry[] {
    const lines = this.preprocessText(text);
    const entries: BuJoEntry[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const line of lines) {
      const entry = this.parseLine(line, today);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  private preprocessText(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private parseLine(line: string, collectionDate: string): BuJoEntry | null {
    // Try to match against all bullet patterns
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      if (['task', 'taskComplete', 'taskMigrated', 'taskScheduled', 'event', 'note'].includes(patternName)) {
        const match = line.match(pattern);
        if (match) {
          return this.createEntry(patternName, match[1], line, collectionDate);
        }
      }
    }

    return null;
  }

  private createEntry(
    patternType: string, 
    content: string, 
    originalLine: string, 
    collectionDate: string
  ): BuJoEntry {
    const entry: BuJoEntry = {
      id: this.generateId(),
      type: this.mapEntryType(patternType),
      content: content.trim(),
      status: this.inferStatus(patternType),
      priority: this.extractPriority(originalLine),
      createdAt: new Date(),
      tags: this.extractTags(originalLine),
      contexts: this.extractContexts(originalLine),
      collection: 'daily',
      collectionDate
    };

    // Extract dates if present
    const dates = this.extractDates(originalLine);
    if (dates.length > 0) {
      entry.dueDate = dates[0];
    }

    return entry;
  }

  private mapEntryType(patternType: string): 'task' | 'event' | 'note' {
    switch (patternType) {
      case 'task':
      case 'taskComplete':
      case 'taskMigrated':
      case 'taskScheduled':
        return 'task';
      case 'event':
        return 'event';
      case 'note':
        return 'note';
      default:
        return 'task';
    }
  }

  private inferStatus(patternType: string): BuJoEntry['status'] {
    switch (patternType) {
      case 'taskComplete':
        return 'complete';
      case 'taskMigrated':
        return 'migrated';
      case 'taskScheduled':
        return 'scheduled';
      default:
        return 'incomplete';
    }
  }

  private extractPriority(text: string): BuJoEntry['priority'] {
    if (this.patterns.priority.test(text)) {
      return 'high';
    }
    return 'none';
  }

  private extractTags(text: string): string[] {
    const matches = text.matchAll(this.patterns.hashtag);
    return Array.from(matches, m => m[1]);
  }

  private extractContexts(text: string): string[] {
    const matches = text.matchAll(this.patterns.context);
    return Array.from(matches, m => m[1]);
  }

  private extractDates(text: string): Date[] {
    const dates: Date[] = [];
    const dateMatches = text.match(this.patterns.date);
    
    if (dateMatches) {
      for (const match of dateMatches) {
        const date = new Date(match);
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      }
    }

    return dates;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}