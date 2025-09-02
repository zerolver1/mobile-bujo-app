import { BuJoEntry } from '../../types/BuJo';

/**
 * Enhanced Bullet Journal Parser that handles both traditional bullet notation
 * and natural language entries from OCR text
 */
export class EnhancedBuJoParser {
  private readonly patterns = {
    // Official Bullet Journal Method - Core bullets with OCR variations
    // TASKS
    task: /^[\•·∙⋅‧\.]\s+(.+)$/,  // • (bullet/dot) = Task
    taskComplete: /^[xX✓✔×]\s*[\•·∙⋅‧\.]?\s*(.+)$/,  // X = Task Complete  
    taskMigrated: /^[>→➜]\s*[\•·∙⋅‧\.]?\s*(.+)$/,  // > = Task Migrated (moved to new Monthly Log)
    taskScheduled: /^[<←⬅]\s*[\•·∙⋅‧\.]?\s*(.+)$/,  // < = Task Scheduled (moved to Future Log)
    taskIrrelevant: /^[\~]\s*[\•·∙⋅‧\.]?\s*(.+)$/,  // ~ = Task Irrelevant/Cancelled
    
    // EVENTS
    event: /^[○◦oO0Ø]\s+(.+)$/,  // O (circle) = Event
    
    // NOTES  
    note: /^[\-–—−]\s+(.+)$/,  // - (dash) = Note
    
    // EXTENDED ENTRY TYPES
    inspiration: /^[★☆!]\s+(.+)$/,  // ★ or ! = Inspiration/Idea
    research: /^[&]\s+(.+)$/,  // & = Research
    memory: /^[◇◆♢♦]\s+(.+)$/,  // ◇ = Memory/Gratitude
    
    // Mood indicators (can be standalone or with other entries)
    moodExcellent: /\b(feeling\s+)?(excellent|amazing|fantastic|wonderful|great|awesome)\b/i,
    moodGood: /\b(feeling\s+)?(good|happy|positive|nice|okay|fine)\b/i,
    moodNeutral: /\b(feeling\s+)?(neutral|meh|average|so-so)\b/i,
    moodPoor: /\b(feeling\s+)?(poor|bad|sad|terrible|awful|difficult|challenging)\b/i,
    
    // Gratitude patterns
    gratitude: /^(grateful\s+for|thankful\s+for|appreciate|blessed\s+by)\s+(.+)/i,
    gratitudeList: /^gratitude[:]\s*(.+)/i,
    
    // SIGNIFIERS (prefix any bullet)
    priorityTask: /^[\*]\s*[\•·∙⋅‧\.]\s+(.+)$/,  // * • = Priority Task
    priorityEvent: /^[\*]\s*[○◦oO0Ø]\s+(.+)$/,  // * O = Priority Event
    priorityNote: /^[\*]\s*[\-–—−]\s+(.+)$/,  // * - = Important Note
    
    // Natural language patterns (for OCR without bullets)
    appointment: /(.+)\s+@\s*(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/,
    lunchMeeting: /(.+)\s+for\s+(lunch|dinner|breakfast|coffee|meeting)\s+@\s*(.+)/i,
    percentTask: /(\d+)%\s+for\s+(.+)/,
    actionVerb: /^(pick up|make|finish|complete|start|buy|call|email|send|write|read|review|prepare|organize|clean|fix|schedule|book|cancel|confirm|check|update|submit|download|upload|print|scan|pay|order|return|collect|deliver|setup|install|configure|test|debug|deploy|publish|merge|push|pull|commit)\s+(.+)/i,
    watchingReading: /^(started|finished|completed|watching|reading|listening to)\s+(.+)/i,
    
    // Date headers - enhanced with more patterns
    dateHeader: /^(\d{1,2})(st|nd|rd|th)?$/,
    monthDateHeader: /^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(st|nd|rd|th)?(\s*,?\s*(\d{2,4}))?/i,
    fullDateHeader: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/,
    relativeDate: /^(today|tomorrow|yesterday|next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month))\b/i,
    weekdayHeader: /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s*,?\s*(.+)?/i,
    
    // Context & tags
    context: /@([a-zA-Z0-9_]+)/g,
    hashtag: /#([a-zA-Z0-9_]+)/g,
    priority: /(!{1,2}|\*{1,2})\s*$/,
    
    // Times
    time: /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/g,
    timeRange: /(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/g,
    
    // Common abbreviations
    therapy: /\bOT\b|\bPT\b|\btherapy\b/i,
    ticket: /\bticket[s]?\b/i,
    percentComplete: /(\d+)%/
  };

  parse(text: string): BuJoEntry[] {
    const entries: BuJoEntry[] = [];
    
    if (!text || typeof text !== 'string') {
      console.warn('EnhancedBuJoParser: Invalid text input');
      return entries;
    }
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    let dateContext: Date | null = null;

    for (const line of lines) {
      try {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) continue;

        // Check if this is a date header
        const dateHeader = this.parseDateHeader(trimmedLine, currentYear, currentMonth);
        if (dateHeader) {
          dateContext = dateHeader;
          currentDate = dateHeader;
          console.log('EnhancedBuJoParser: Found date header:', trimmedLine, '→', dateContext.toISOString().split('T')[0]);
          continue;
        }

        // Parse the line as an entry
        const entry = this.parseLine(trimmedLine, dateContext || currentDate);
        if (entry) {
          entries.push(entry);
        }
      } catch (error) {
        console.error('EnhancedBuJoParser: Error parsing line:', line, error);
        // Continue parsing other lines even if one fails
      }
    }

    console.log('EnhancedBuJoParser: Parsed', entries.length, 'entries');
    return entries;
  }

  private parseDateHeader(line: string, year: number, month: number): Date | null {
    // Check for relative dates first (e.g., "today", "tomorrow", "next monday")
    const relativeDateMatch = line.match(this.patterns.relativeDate);
    if (relativeDateMatch) {
      const today = new Date();
      const relativeTerm = relativeDateMatch[1].toLowerCase();
      
      if (relativeTerm === 'today') {
        return today;
      } else if (relativeTerm === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      } else if (relativeTerm === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      } else if (relativeTerm.startsWith('next')) {
        return this.getNextWeekday(relativeTerm, today);
      }
    }
    
    // Check for weekday headers (e.g., "Monday", "Tuesday, March 15")
    const weekdayMatch = line.match(this.patterns.weekdayHeader);
    if (weekdayMatch) {
      const weekdayName = weekdayMatch[1];
      const extraInfo = weekdayMatch[2];
      
      // If there's extra date info, try to parse it
      if (extraInfo) {
        const monthDayMatch = extraInfo.match(this.patterns.monthDateHeader);
        if (monthDayMatch) {
          const monthName = monthDayMatch[1];
          const day = parseInt(monthDayMatch[2]);
          const providedYear = monthDayMatch[4] ? parseInt(monthDayMatch[4]) : year;
          const monthIndex = this.getMonthIndex(monthName);
          if (monthIndex !== -1 && day >= 1 && day <= 31) {
            return new Date(providedYear, monthIndex, day);
          }
        }
      }
      
      // Otherwise find the next occurrence of this weekday
      return this.getNextWeekday(`next ${weekdayName}`, new Date());
    }

    // Check for simple day number (e.g., "15th", "16th")
    const dayMatch = line.match(this.patterns.dateHeader);
    if (dayMatch) {
      const day = parseInt(dayMatch[1]);
      if (day >= 1 && day <= 31) {
        return new Date(year, month, day);
      }
    }

    // Check for month + day (e.g., "March 15th", "Mar 15, 2025")
    const monthDayMatch = line.match(this.patterns.monthDateHeader);
    if (monthDayMatch) {
      const monthName = monthDayMatch[1];
      const day = parseInt(monthDayMatch[2]);
      const providedYear = monthDayMatch[4] ? parseInt(monthDayMatch[4]) : year;
      const monthIndex = this.getMonthIndex(monthName);
      if (monthIndex !== -1 && day >= 1 && day <= 31) {
        return new Date(providedYear, monthIndex, day);
      }
    }

    // Check for full date (e.g., "3/15/2025")
    const fullDateMatch = line.match(this.patterns.fullDateHeader);
    if (fullDateMatch) {
      const month = parseInt(fullDateMatch[1]) - 1; // JS months are 0-indexed
      const day = parseInt(fullDateMatch[2]);
      const yearPart = parseInt(fullDateMatch[3]);
      const fullYear = yearPart < 100 ? 2000 + yearPart : yearPart;
      return new Date(fullYear, month, day);
    }

    return null;
  }
  
  private getNextWeekday(relativeTerm: string, today: Date): Date {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetWeekday = relativeTerm.split(' ')[1]?.toLowerCase();
    
    if (!targetWeekday || !weekdays.includes(targetWeekday)) {
      return today; // fallback
    }
    
    const targetDayIndex = weekdays.indexOf(targetWeekday);
    const todayIndex = today.getDay();
    
    let daysToAdd = targetDayIndex - todayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return targetDate;
  }

  private parseLine(line: string, currentDate: Date): BuJoEntry | null {
    const collectionDate = currentDate.toISOString().split('T')[0];
    
    // First, check for priority signifiers (they come before bullets)
    const priorityPatterns = ['priorityTask', 'priorityEvent', 'priorityNote'];
    for (const patternName of priorityPatterns) {
      const pattern = this.patterns[patternName];
      const match = line.match(pattern as RegExp);
      if (match) {
        console.log(`EnhancedBuJoParser: Found priority "${patternName}" in:`, line);
        const baseType = patternName.replace('priority', '').toLowerCase();
        const entry = this.createEntry(baseType, match[1], line, collectionDate, currentDate);
        entry.priority = 'high';
        return entry;
      }
    }
    
    // Then try traditional bullet patterns
    const bulletPatterns = [
      'task', 'taskComplete', 'taskMigrated', 'taskScheduled', 'taskIrrelevant', 
      'event', 'note', 'inspiration', 'research', 'memory'
    ];
    for (const patternName of bulletPatterns) {
      const pattern = this.patterns[patternName];
      const match = line.match(pattern as RegExp);
      if (match) {
        console.log(`EnhancedBuJoParser: Found bullet "${patternName}" in:`, line);
        return this.createEntry(patternName, match[1], line, collectionDate, currentDate);
      }
    }

    // If no bullet found, try natural language patterns
    return this.parseNaturalLanguage(line, collectionDate, currentDate);
  }

  private parseNaturalLanguage(line: string, collectionDate: string, currentDate: Date): BuJoEntry | null {
    // Check for mood patterns
    const moodPatterns = ['moodExcellent', 'moodGood', 'moodNeutral', 'moodPoor'];
    for (const moodPattern of moodPatterns) {
      const match = line.match(this.patterns[moodPattern] as RegExp);
      if (match) {
        const entry = this.createEntry('memory', line, line, collectionDate, currentDate);
        entry.mood = this.extractMoodFromPattern(moodPattern);
        return entry;
      }
    }
    
    // Check for gratitude patterns
    const gratitudeMatch = line.match(this.patterns.gratitude);
    if (gratitudeMatch) {
      const entry = this.createEntry('memory', gratitudeMatch[2], line, collectionDate, currentDate);
      entry.gratitude = [gratitudeMatch[2]];
      return entry;
    }
    
    const gratitudeListMatch = line.match(this.patterns.gratitudeList);
    if (gratitudeListMatch) {
      const entry = this.createEntry('memory', 'Daily gratitude', line, collectionDate, currentDate);
      entry.gratitude = gratitudeListMatch[1].split(/[,;]/).map(item => item.trim());
      return entry;
    }

    // Check for appointment pattern (e.g., "OT @ 3pm")
    const appointmentMatch = line.match(this.patterns.appointment);
    if (appointmentMatch && appointmentMatch[1] && appointmentMatch[2]) {
      const [_, content, time] = appointmentMatch;
      const entry = this.createEntry('event', content.trim(), line, collectionDate, currentDate);
      entry.type = 'event';
      // Parse and add time
      const parsedTime = this.parseTime(time);
      if (parsedTime) {
        const eventDate = new Date(currentDate);
        eventDate.setHours(parsedTime.hours, parsedTime.minutes);
        entry.dueDate = eventDate;
      }
      return entry;
    }

    // Check for lunch/dinner meetings (e.g., "Amy for lunch @ 11:30 am")
    const lunchMatch = line.match(this.patterns.lunchMeeting);
    if (lunchMatch && lunchMatch[1] && lunchMatch[2] && lunchMatch[3]) {
      const [_, who, mealType, time] = lunchMatch;
      const content = `${who.trim()} for ${mealType} @ ${time}`;
      const entry = this.createEntry('event', content, line, collectionDate, currentDate);
      entry.type = 'event';
      return entry;
    }

    // Check for percentage tasks (e.g., "100% for UNC tickets")
    const percentMatch = line.match(this.patterns.percentTask);
    if (percentMatch && percentMatch[1] && percentMatch[2]) {
      const [_, percent, task] = percentMatch;
      const content = `${task.trim()} (${percent}%)`;
      const entry = this.createEntry('task', content, line, collectionDate, currentDate);
      if (percent === '100') {
        entry.status = 'complete';
      }
      return entry;
    }

    // Check for action verbs (e.g., "Pick up library book")
    const actionMatch = line.match(this.patterns.actionVerb);
    if (actionMatch) {
      const entry = this.createEntry('task', line, line, collectionDate, currentDate);
      return entry;
    }

    // Check for watching/reading (e.g., "Started watching Vikings")
    const watchingMatch = line.match(this.patterns.watchingReading);
    if (watchingMatch) {
      const entry = this.createEntry('note', line, line, collectionDate, currentDate);
      return entry;
    }

    // Default: treat as a task if it starts with capital letter or contains action words
    if (/^[A-Z]/.test(line) || /\b(finish|make|pick up|call|email|buy)\b/i.test(line)) {
      return this.createEntry('task', line, line, collectionDate, currentDate);
    }

    // Otherwise, treat as a note
    if (line.length > 5) {
      return this.createEntry('note', line, line, collectionDate, currentDate);
    }

    return null;
  }

  private createEntry(
    patternType: string, 
    content: string, 
    originalLine: string, 
    collectionDate: string,
    currentDate: Date
  ): BuJoEntry {
    const entry: BuJoEntry = {
      id: this.generateId(),
      type: this.mapEntryType(patternType),
      content: this.cleanContent(content),
      status: this.inferStatus(patternType, originalLine),
      priority: this.extractPriority(originalLine),
      createdAt: new Date(),
      tags: this.extractTags(originalLine),
      contexts: this.extractContexts(originalLine),
      collection: 'daily',
      collectionDate
    };

    // Extract and parse times
    const timeMatch = originalLine.match(this.patterns.time);
    if (timeMatch) {
      const parsedTime = this.parseTime(timeMatch[1]);
      if (parsedTime) {
        const eventDate = new Date(currentDate);
        eventDate.setHours(parsedTime.hours, parsedTime.minutes);
        entry.dueDate = eventDate;
      }
    }

    return entry;
  }

  private cleanContent(content: string | undefined): string {
    if (!content) return '';
    
    // Remove priority markers, contexts, and tags from content
    return content
      .replace(this.patterns.priority, '')
      .replace(this.patterns.context, '')
      .replace(this.patterns.hashtag, '')
      .trim();
  }

  private mapEntryType(patternType: string): 'task' | 'event' | 'note' | 'inspiration' | 'research' | 'memory' | 'custom' {
    switch (patternType) {
      case 'task':
      case 'taskComplete':
      case 'taskMigrated':
      case 'taskScheduled':
      case 'taskIrrelevant':
      case 'priorityTask':
        return 'task';
      case 'event':
      case 'priorityEvent':
        return 'event';
      case 'note':
      case 'priorityNote':
        return 'note';
      case 'inspiration':
      case 'idea':
        return 'inspiration';
      case 'research':
        return 'research';
      case 'memory':
      case 'gratitude':
        return 'memory';
      default:
        return 'task';
    }
  }

  private inferStatus(patternType: string, originalLine: string): BuJoEntry['status'] {
    switch (patternType) {
      case 'taskComplete':
        return 'complete';
      case 'taskMigrated':
        return 'migrated';
      case 'taskScheduled':
        return 'scheduled';
      case 'taskIrrelevant':
        return 'cancelled';
      default:
        // Check for completion indicators
        if (/\b(done|completed|finished)\b/i.test(originalLine) || /100%/.test(originalLine)) {
          return 'complete';
        }
        return 'incomplete';
    }
  }

  private extractPriority(text: string): BuJoEntry['priority'] {
    if (/!!/.test(text)) {
      return 'high';
    }
    if (/!/.test(text)) {
      return 'medium';
    }
    if (this.patterns.priority.test(text)) {
      return 'medium';
    }
    return 'none';
  }

  private extractTags(text: string): string[] {
    const matches = text.matchAll(this.patterns.hashtag);
    return Array.from(matches, m => m[1]);
  }

  private extractContexts(text: string): string[] {
    const matches = text.matchAll(this.patterns.context);
    const contexts = Array.from(matches, m => m[1]);
    
    // Also extract implicit contexts
    if (/\b(work|office)\b/i.test(text)) contexts.push('work');
    if (/\b(home|house)\b/i.test(text)) contexts.push('home');
    if (/\b(personal|family)\b/i.test(text)) contexts.push('personal');
    
    return [...new Set(contexts)]; // Remove duplicates
  }

  private parseTime(timeStr: string | undefined): { hours: number, minutes: number } | null {
    if (!timeStr) return null;
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3];
      
      if (period) {
        const isPM = period.toLowerCase() === 'pm';
        if (isPM && hours !== 12) {
          hours += 12;
        } else if (!isPM && hours === 12) {
          hours = 0;
        }
      }
      
      return { hours, minutes };
    }
    return null;
  }

  private getMonthIndex(monthName: string): number {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return months.indexOf(monthName.toLowerCase());
  }

  private extractMoodFromPattern(patternName: string): 'excellent' | 'good' | 'neutral' | 'poor' | undefined {
    switch (patternName) {
      case 'moodExcellent':
        return 'excellent';
      case 'moodGood':
        return 'good';
      case 'moodNeutral':
        return 'neutral';
      case 'moodPoor':
        return 'poor';
      default:
        return undefined;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export const enhancedBuJoParser = new EnhancedBuJoParser();