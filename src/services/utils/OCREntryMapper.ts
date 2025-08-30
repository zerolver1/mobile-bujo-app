import { BuJoEntry } from '../../types/BuJo';
import { ImageMetadata } from './ImageMetadataService';

/**
 * Utility class for mapping entries from different OCR services to a consistent BuJoEntry format
 * Ensures consistent structure regardless of which OCR provider was used
 */
export class OCREntryMapper {
  /**
   * Map entries from any OCR service to consistent BuJoEntry format
   */
  static mapToConsistentFormat(
    entries: any[], 
    source: 'gpt-vision' | 'mistral' | 'parser' | 'ocr-space',
    confidence: number = 0.9,
    imageMetadata?: ImageMetadata
  ): BuJoEntry[] {
    return entries.map(entry => this.mapSingleEntry(entry, source, confidence, imageMetadata));
  }

  /**
   * Map a single entry to BuJoEntry format
   */
  private static mapSingleEntry(
    entry: any, 
    source: 'gpt-vision' | 'mistral' | 'parser' | 'ocr-space',
    confidence: number,
    imageMetadata?: ImageMetadata
  ): BuJoEntry {
    // Smart date selection based on priority order
    const selectedDate = this.selectBestDate(entry, imageMetadata);
    
    return {
      id: entry.id || this.generateId(source),
      type: this.normalizeType(entry.type),
      content: this.cleanContent(entry.content),
      status: this.normalizeStatus(entry.status),
      priority: this.normalizePriority(entry.priority),
      createdAt: entry.createdAt instanceof Date ? entry.createdAt : new Date(),
      collection: entry.collection || 'daily',
      collectionDate: selectedDate,
      tags: this.normalizeTags(entry.tags),
      contexts: this.normalizeContexts(entry.contexts),
      ocrConfidence: entry.confidence || entry.ocrConfidence || confidence,
      sourceImage: entry.sourceImage,
      dueDate: entry.dueDate instanceof Date ? entry.dueDate : undefined,
      boundingBox: entry.boundingBox,
      mood: this.normalizeMood(entry.mood || entry.content),
      gratitude: this.normalizeGratitude(entry.gratitude),
      photoUri: entry.photoUri,
    };
  }

  /**
   * Select the best date for an entry based on priority order:
   * 1. Handwritten page dates (from OCR detection)
   * 2. Individual entry dates (from OCR)
   * 3. Image EXIF timestamp
   * 4. Estimated journal date
   * 5. Today's date (fallback)
   */
  private static selectBestDate(entry: any, imageMetadata?: ImageMetadata): string {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    console.log('OCREntryMapper: Selecting date for entry:', {
      entryPageDate: entry.pageDate,
      entryPage_date: entry.page_date,
      entryDate: entry.date,
      entryCollectionDate: entry.collectionDate,
      hasImageMetadata: !!imageMetadata,
      imageCreatedAt: imageMetadata?.createdAt,
      estimatedJournalDate: imageMetadata?.estimatedJournalDate
    });

    // 1. Check for handwritten page date from OCR (highest priority)
    if (entry.pageDate || entry.page_date) {
      const pageDate = this.parseDate(entry.pageDate || entry.page_date);
      if (pageDate) {
        console.log('OCREntryMapper: Using page date from OCR:', pageDate);
        return pageDate;
      }
    }

    // 2. Check for individual entry date from OCR
    if (entry.date) {
      const entryDate = this.parseDate(entry.date);
      if (entryDate) {
        console.log('OCREntryMapper: Using entry date from OCR:', entryDate);
        return entryDate;
      }
    }

    // 3. Check for existing collectionDate (might be pre-set)
    if (entry.collectionDate) {
      const collectionDate = this.parseDate(entry.collectionDate);
      if (collectionDate) {
        console.log('OCREntryMapper: Using existing collection date:', collectionDate);
        return collectionDate;
      }
    }

    // 4. Use image metadata if available
    if (imageMetadata) {
      // Prefer estimated journal date if available and reasonable
      if (imageMetadata.estimatedJournalDate) {
        const journalDate = imageMetadata.estimatedJournalDate.toISOString().split('T')[0];
        const daysDiff = Math.abs(today.getTime() - imageMetadata.estimatedJournalDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 30) { // Within 30 days
          console.log('OCREntryMapper: Using estimated journal date:', journalDate);
          return journalDate;
        }
      }

      // Fall back to image creation date if recent
      if (imageMetadata.createdAt) {
        const imageDate = imageMetadata.createdAt.toISOString().split('T')[0];
        const daysDiff = Math.abs(today.getTime() - imageMetadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 7) { // Within 7 days
          console.log('OCREntryMapper: Using image creation date:', imageDate);
          return imageDate;
        }
      }
    }

    // 5. Fallback to today
    console.log('OCREntryMapper: No valid dates found, falling back to today\'s date:', todayString);
    return todayString;
  }

  /**
   * Parse various date formats commonly found in bullet journals
   */
  private static parseDate(dateInput: any): string | null {
    if (!dateInput) return null;

    try {
      // If it's already a Date object
      if (dateInput instanceof Date) {
        return dateInput.toISOString().split('T')[0];
      }

      // If it's already in YYYY-MM-DD format
      if (typeof dateInput === 'string') {
        const dateString = dateInput.trim();

        // ISO format (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const testDate = new Date(dateString + 'T00:00:00Z');
          if (!isNaN(testDate.getTime())) {
            return dateString;
          }
        }

        // Try various common formats
        const patterns = [
          // American formats
          { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: [2, 0, 1] }, // MM/DD/YYYY
          { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, order: [2, 0, 1] }, // MM/DD/YY
          
          // European formats  
          { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: [2, 1, 0] }, // DD/MM/YYYY
          { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, order: [2, 1, 0] }, // DD.MM.YYYY
          
          // Condensed formats
          { regex: /^(\d{4})(\d{2})(\d{2})$/, order: [0, 1, 2] }, // YYYYMMDD
          { regex: /^(\d{2})(\d{2})(\d{4})$/, order: [2, 0, 1] }, // MMDDYYYY
          
          // With separators
          { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: [0, 1, 2] }, // YYYY-M-D
          { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: [2, 0, 1] }, // M-D-YYYY
        ];

        for (const pattern of patterns) {
          const match = dateString.match(pattern.regex);
          if (match) {
            let [, ...parts] = match;
            let [year, month, day] = pattern.order.map(i => parseInt(parts[i]));

            // Handle 2-digit years
            if (year < 100) {
              year += year < 50 ? 2000 : 1900;
            }

            // Validate ranges
            if (year < 1900 || year > 2100) continue;
            if (month < 1 || month > 12) continue;
            if (day < 1 || day > 31) continue;

            const testDate = new Date(Date.UTC(year, month - 1, day));
            if (testDate.getFullYear() === year && 
                testDate.getMonth() === month - 1 && 
                testDate.getDate() === day) {
              
              const result = testDate.toISOString().split('T')[0];
              console.log('OCREntryMapper: Parsed date successfully:', dateString, '->', result);
              return result;
            }
          }
        }

        // Try natural language parsing for common phrases
        const naturalDate = this.parseNaturalDate(dateString);
        if (naturalDate) {
          console.log('OCREntryMapper: Parsed natural date:', dateString, '->', naturalDate);
          return naturalDate;
        }

        // Try JavaScript Date parsing as last resort
        const jsDate = new Date(dateString);
        if (!isNaN(jsDate.getTime())) {
          const result = jsDate.toISOString().split('T')[0];
          console.log('OCREntryMapper: Parsed with JS Date:', dateString, '->', result);
          return result;
        }
      }

      console.warn('OCREntryMapper: Could not parse date:', dateInput);
      return null;

    } catch (error) {
      console.error('OCREntryMapper: Error parsing date:', dateInput, error);
      return null;
    }
  }

  /**
   * Parse natural language date expressions
   */
  private static parseNaturalDate(dateString: string): string | null {
    const today = new Date();
    const normalizedInput = dateString.toLowerCase().trim();

    // Handle relative dates
    if (normalizedInput.includes('today')) {
      return today.toISOString().split('T')[0];
    }

    if (normalizedInput.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }

    if (normalizedInput.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    // Handle weekday names
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = today.getDay();
    
    for (let i = 0; i < weekdays.length; i++) {
      if (normalizedInput.includes(weekdays[i])) {
        const targetDay = i;
        let daysAhead = targetDay - currentDay;
        
        // If the target day has passed this week, target next week
        if (daysAhead < 0) {
          daysAhead += 7;
        }
        
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysAhead);
        return targetDate.toISOString().split('T')[0];
      }
    }

    // Handle month names
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];

    // Look for "Month DD" or "DD Month" patterns
    for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
      const monthName = months[monthIndex];
      if (normalizedInput.includes(monthName)) {
        // Extract day number
        const dayMatch = normalizedInput.match(/(\d{1,2})/);
        if (dayMatch) {
          const day = parseInt(dayMatch[1]);
          if (day >= 1 && day <= 31) {
            const year = today.getFullYear();
            const testDate = new Date(Date.UTC(year, monthIndex, day));
            
            // If the date has passed this year, assume next year
            if (testDate < today) {
              testDate.setUTCFullYear(year + 1);
            }
            
            return testDate.toISOString().split('T')[0];
          }
        }
      }
    }

    return null;
  }

  /**
   * Normalize entry type to valid BuJo types
   */
  private static normalizeType(type: any): 'task' | 'event' | 'note' | 'inspiration' | 'research' | 'memory' | 'custom' {
    if (typeof type !== 'string') return 'task';
    
    const normalizedType = type.toLowerCase().trim();
    
    switch (normalizedType) {
      case 'task':
      case 'todo':
      case 'action':
      case 'incomplete':
        return 'task';
      case 'event':
      case 'appointment':
      case 'meeting':
      case 'scheduled':
        return 'event';
      case 'note':
      case 'observation':
      case 'thought':
        return 'note';
      case 'inspiration':
      case 'idea':
      case 'brilliant':
      case 'creative':
        return 'inspiration';
      case 'research':
      case 'investigate':
      case 'study':
      case 'learning':
      case 'explore':
        return 'research';
      case 'memory':
      case 'gratitude':
      case 'reflection':
      case 'memorable':
      case 'special':
        return 'memory';
      case 'custom':
      case 'personal':
      case 'signifier':
        return 'custom';
      default:
        return 'task'; // Default fallback
    }
  }

  /**
   * Normalize entry status to valid BuJo status values
   */
  private static normalizeStatus(status: any): 'incomplete' | 'complete' | 'migrated' | 'scheduled' | 'cancelled' {
    if (typeof status !== 'string') return 'incomplete';
    
    const normalizedStatus = status.toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'complete':
      case 'completed':
      case 'done':
      case 'finished':
        return 'complete';
      case 'incomplete':
      case 'pending':
      case 'todo':
      case 'open':
        return 'incomplete';
      case 'migrated':
      case 'moved':
      case 'transferred':
        return 'migrated';
      case 'scheduled':
      case 'planned':
      case 'future':
        return 'scheduled';
      case 'cancelled':
      case 'canceled':
      case 'irrelevant':
      case 'dropped':
        return 'cancelled';
      default:
        return 'incomplete'; // Default fallback
    }
  }

  /**
   * Normalize priority to valid BuJo priority values
   */
  private static normalizePriority(priority: any): 'none' | 'low' | 'medium' | 'high' {
    if (typeof priority !== 'string') return 'none';
    
    const normalizedPriority = priority.toLowerCase().trim();
    
    switch (normalizedPriority) {
      case 'high':
      case 'important':
      case 'urgent':
      case 'critical':
      case 'priority':
        return 'high';
      case 'medium':
      case 'moderate':
      case 'normal':
        return 'medium';
      case 'low':
      case 'minor':
        return 'low';
      case 'none':
      case 'no':
      default:
        return 'none';
    }
  }

  /**
   * Clean and normalize content text
   */
  private static cleanContent(content: any): string {
    if (typeof content !== 'string') return '';
    
    return content
      // Remove bullet symbols that might leak into content
      .replace(/^[\•·∙⋅‧\.✓✔×xX>→➜<←⬅~○◦oO0Ø\-–—−!*]+\s*/, '')
      // Remove excess whitespace
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
      // Remove OCR artifacts
      .replace(/[""'']/g, '"') // Normalize quotes
      .replace(/[…]/g, '...') // Normalize ellipsis
      // Capitalize first letter if it's all lowercase (common OCR issue)
      .replace(/^[a-z]/, char => char.toUpperCase());
  }

  /**
   * Normalize tags array
   */
  private static normalizeTags(tags: any): string[] {
    if (!Array.isArray(tags)) return [];
    
    return tags
      .map(tag => {
        if (typeof tag !== 'string') return '';
        
        // Remove # prefix if present and normalize
        return tag.replace(/^#/, '').trim().toLowerCase();
      })
      .filter(tag => tag.length > 0)
      // Remove duplicates
      .filter((tag, index, array) => array.indexOf(tag) === index);
  }

  /**
   * Normalize contexts array
   */
  private static normalizeContexts(contexts: any): string[] {
    if (!Array.isArray(contexts)) return [];
    
    return contexts
      .map(context => {
        if (typeof context !== 'string') return '';
        
        // Remove @ prefix if present and normalize
        return context.replace(/^@/, '').trim().toLowerCase();
      })
      .filter(context => context.length > 0)
      // Remove duplicates
      .filter((context, index, array) => array.indexOf(context) === index);
  }

  /**
   * Normalize mood from text or explicit mood field
   */
  private static normalizeMood(moodOrText: any): 'excellent' | 'good' | 'neutral' | 'poor' | undefined {
    if (!moodOrText) return undefined;
    
    const text = typeof moodOrText === 'string' ? moodOrText.toLowerCase() : '';
    
    // Explicit mood indicators
    if (/\b(excellent|amazing|fantastic|wonderful|great|awesome)\b/i.test(text)) {
      return 'excellent';
    }
    if (/\b(good|happy|positive|nice|okay|fine)\b/i.test(text)) {
      return 'good';
    }
    if (/\b(neutral|meh|average|so-so)\b/i.test(text)) {
      return 'neutral';
    }
    if (/\b(poor|bad|sad|terrible|awful|difficult|challenging)\b/i.test(text)) {
      return 'poor';
    }
    
    // Emoji mood indicators
    if (/😄|😊|😍|🥰|😁|🙂|😃/i.test(text)) {
      return 'excellent';
    }
    if (/🙂|😌|😇|☺️/i.test(text)) {
      return 'good';
    }
    if (/😐|😑|😶/i.test(text)) {
      return 'neutral';
    }
    if (/😔|😞|😟|😢|😭|😰/i.test(text)) {
      return 'poor';
    }
    
    return undefined;
  }

  /**
   * Normalize gratitude array from various inputs
   */
  private static normalizeGratitude(gratitude: any): string[] | undefined {
    if (!gratitude) return undefined;
    
    if (Array.isArray(gratitude)) {
      return gratitude
        .map(item => typeof item === 'string' ? item.trim() : '')
        .filter(item => item.length > 0);
    }
    
    if (typeof gratitude === 'string') {
      // Split by common separators and clean up
      return gratitude
        .split(/[,;|\n]/)
        .map(item => item.replace(/^[-*•]\s*/, '').trim())
        .filter(item => item.length > 0);
    }
    
    return undefined;
  }

  /**
   * Generate consistent ID based on source
   */
  private static generateId(source: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `${source}-${timestamp}-${random}`;
  }

  /**
   * Validate that an entry has required fields
   */
  static validateEntry(entry: BuJoEntry): boolean {
    return !!(
      entry.id &&
      entry.type &&
      entry.content &&
      entry.status &&
      entry.priority !== undefined &&
      entry.createdAt &&
      entry.collection &&
      entry.collectionDate &&
      Array.isArray(entry.tags) &&
      Array.isArray(entry.contexts)
    );
  }

  /**
   * Fix common OCR content issues
   */
  static fixCommonOCRIssues(content: string): string {
    return content
      // Fix common character recognition errors
      .replace(/\b0(?=\d)/g, 'O') // 0 → O in words like "OT" 
      .replace(/\bl(?=\s|$)/g, 'I') // lowercase l → I at word endings
      .replace(/\brn(?=\s|$)/g, 'n') // rn → n (common OCR error)
      .replace(/\b1(?=[a-zA-Z])/g, 'l') // 1 → l before letters
      // Fix time formats
      .replace(/(\d{1,2})[.:;](\d{2})\s*(am|pm|AM|PM)/g, '$1:$2 $3')
      // Fix common bullet journal abbreviations
      .replace(/\bOT\b/g, 'OT') // Occupational Therapy
      .replace(/\bPT\b/g, 'PT') // Physical Therapy
      // Remove duplicate spaces
      .replace(/\s+/g, ' ')
      .trim();
  }
}