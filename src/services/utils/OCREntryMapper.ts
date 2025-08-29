import { BuJoEntry } from '../../types/BuJo';

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
    confidence: number = 0.9
  ): BuJoEntry[] {
    return entries.map(entry => this.mapSingleEntry(entry, source, confidence));
  }

  /**
   * Map a single entry to BuJoEntry format
   */
  private static mapSingleEntry(
    entry: any, 
    source: 'gpt-vision' | 'mistral' | 'parser' | 'ocr-space',
    confidence: number
  ): BuJoEntry {
    const today = new Date();
    
    return {
      id: entry.id || this.generateId(source),
      type: this.normalizeType(entry.type),
      content: this.cleanContent(entry.content),
      status: this.normalizeStatus(entry.status),
      priority: this.normalizePriority(entry.priority),
      createdAt: entry.createdAt instanceof Date ? entry.createdAt : new Date(),
      collection: entry.collection || 'daily',
      collectionDate: entry.collectionDate || today.toISOString().split('T')[0],
      tags: this.normalizeTags(entry.tags),
      contexts: this.normalizeContexts(entry.contexts),
      ocrConfidence: entry.confidence || entry.ocrConfidence || confidence,
      sourceImage: entry.sourceImage,
      dueDate: entry.dueDate instanceof Date ? entry.dueDate : undefined,
      boundingBox: entry.boundingBox,
    };
  }

  /**
   * Normalize entry type to valid BuJo types
   */
  private static normalizeType(type: any): 'task' | 'event' | 'note' {
    if (typeof type !== 'string') return 'task';
    
    const normalizedType = type.toLowerCase().trim();
    
    switch (normalizedType) {
      case 'task':
      case 'todo':
      case 'action':
        return 'task';
      case 'event':
      case 'appointment':
      case 'meeting':
        return 'event';
      case 'note':
      case 'idea':
      case 'thought':
      case 'observation':
        return 'note';
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
  private static normalizePriority(priority: any): 'none' | 'high' {
    if (typeof priority !== 'string') return 'none';
    
    const normalizedPriority = priority.toLowerCase().trim();
    
    switch (normalizedPriority) {
      case 'high':
      case 'important':
      case 'urgent':
      case 'critical':
      case 'priority':
        return 'high';
      case 'none':
      case 'normal':
      case 'low':
      case 'medium':
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